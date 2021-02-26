
function createLibraryButton(content, type) {
    var library_btn = document.createElement('span')
    library_btn.setAttribute('class', 'library-button')
    library_btn.setAttribute('id', spaceToBar(content))
    library_btn.setAttribute('type', type)
    library_btn.setAttribute('status', 'up')
    library_btn.innerHTML = content
    return library_btn
}

function bindLibraryButton(library_btn) {

    library_btn.onclick = function(){
        if(library_btn.getAttribute('type') == 'topic'){
            if(library_btn.getAttribute('status') == 'up'){
                library_btn.setAttribute('status', 'down')
                library_btn.setAttribute('style', 'color:white; background-color: rgb(241, 150, 82);')
                tags_filter.push(library_btn.innerHTML)
            } else {
                library_btn.setAttribute('status', 'up')
                library_btn.setAttribute('style', 'color:rgb(112, 112, 112); background-color: transparent')
                tags_filter.remove(library_btn.innerHTML)
            }
        } else {
            if(library_btn.getAttribute('status') == 'up'){
                library_btn.setAttribute('status', 'down')
                library_btn.setAttribute('style', 'color:white; background-color: rgb(79, 142, 247);')
                tags_filter.push(library_btn.innerHTML)
            } else {
                library_btn.setAttribute('status', 'up')
                library_btn.setAttribute('style', 'color:rgb(112, 112, 112); background-color: transparent')
                tags_filter.remove(library_btn.innerHTML)
            }
        }

        displayPaperlist()
        clearOverview()
        current_paper = []
    }
}

function createPaperButton(doc) {
    var paper_btn = document.createElement('span')
    paper_btn.setAttribute('class', 'paperlist-button')
    paper_btn.setAttribute('id', doc._id)
    paper_btn.setAttribute('status', 'up')
    paper_btn.innerHTML = doc.title
    return paper_btn
}

function bindPaperButton(paper_btn) {
    var table = document.querySelector('.overview-table')

    paper_btn.onclick = function(){
        if(clickFlag){
            clickFlag = clearTimeout(clickFlag)
        }
        clickFlag = setTimeout(()=>{
            if(paper_btn.getAttribute('status') == 'up'){
                if(current_paper.length == 1){
                    up_btn = document.getElementById(current_paper[0])
                    up_btn.setAttribute('status', 'up')
                    up_btn.setAttribute('style', 'color:rgb(112, 112, 112); background-color: transparent')
                    current_paper = []
                }
                paper_btn.setAttribute('status', 'down')
                paper_btn.setAttribute('style', 'color:white; background-color: rgb(79, 142, 247);')
                current_paper.push(this.getAttribute('id'))
            } else {
                paper_btn.setAttribute('status', 'up')
                paper_btn.setAttribute('style', 'color:rgb(112, 112, 112); background-color: transparent')
            }

            paperdb.findOne({_id: this.getAttribute('id')}, (err, doc)=>{
                table.style.display = 'table' // display paper info
                
                var dataBuffer = fs.readFileSync(doc.path);
                pdf(dataBuffer).then(data=>{
                    var abstract = extractAbstract(data.text)
                    document.querySelector('#abstract').innerHTML = abstract
                })

                document.querySelector('#title').innerHTML = doc.title
                document.querySelector('#url').innerHTML = doc.url
                document.querySelector('#remark').innerHTML = doc.remark
                document.querySelector('#tags').innerHTML = displayList(doc.tags)

            })
        }, 120)
    }

    paper_btn.ondblclick = function(){
        if(clickFlag){
            clickFlag = clearTimeout(clickFlag)
        }
        paperdb.findOne({_id: current_paper[0]}, (err, doc)=>{
            shell.openPath(doc.path)
        })
    }

    paper_btn.addEventListener('contextmenu', function(e){
        e.preventDefault()
        var paperBtnMenu = Menu.buildFromTemplate(
            paperBtnMenuTemplate(paper_btn))
        paperBtnMenu.popup({window: remote.getCurrentWindow()})
    })

}

function clearPaperList() {
    var paperlist = document.querySelector('.paperlist')
    var paper_btn_list = document.querySelectorAll('.paperlist-button')
    for(var j=0; j<paper_btn_list.length; j++){
        paperlist.removeChild(paper_btn_list[j])
    }
}

function clearLibrary() {
    var library = document.querySelector('.library')
    var library_btn_list = document.querySelectorAll('.library-button')
    for(var j=0; j<library_btn_list.length; j++){
        library.removeChild(library_btn_list[j])
    }
}

function clearOverview() {
    // var overview = document.querySelector('.overview')
    var table = document.querySelector('.overview-table')
    table.style.display = 'none'
}

// display library
// topic tags and research tags
function displayLibrary() {
    // clearLibrary()
    clearOverview()
    var library_topic = document.querySelector('.library-topic')
    var library_research = document.querySelector('.library-research')

    catedb.findOne({class: 'topic'}, (err, doc)=>{
        var topic_tags = doc.tags
        for(var i=0; i<topic_tags.length; i++){
            var library_btn = createLibraryButton(topic_tags[i], 'topic')
            bindLibraryButton(library_btn)
            library_topic.appendChild(library_btn)
        }
    })

    catedb.findOne({class: 'research'}, (err, doc)=>{
        var research_tags = doc.tags
        for(var i=0; i<research_tags.length; i++){
            var research_btn = createLibraryButton(research_tags[i], 'research')
            bindLibraryButton(research_btn)
            library_research.appendChild(research_btn)
        }
    })
}

function displayPaperlist() {
    clearPaperList()

    sub_query = []
    for(var i=0; i<tags_filter.length; i++){
        sub_query.push({tags: {$elemMatch: tags_filter[i]}})
    }
    query = {$and: sub_query}
    paperdb.find(query, (err, docs)=>{
        if(err){
            console.log(err)
            return
        }
        for(var i=0; i<docs.length; i++){
            paper_btn = createPaperButton(docs[i])
            bindPaperButton(paper_btn)
            document.querySelector('.paperlist').appendChild(paper_btn)
        }
    })
    // tags_filter
}

window.onload = function() {

    // display two main parts
    displayLibrary()
    displayPaperlist()

    // func
    bindPaperlistFunc()

    // overview func
    bindOverviewEditor()
}
