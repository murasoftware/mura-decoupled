Mura.init({
    siteid: 'default',
    endpoint:'http://localhost:8888'
});

Mura(function(){

    let currentContent;
    
    Mura.loader()
    .loadcss(Mura.endpoint + '/core/modules/v1/core_assets/css/mura.10.min.css')
    .loadcss(Mura.endpoint + '/core/modules/v1/core_assets/css/mura.10.skin.css')
    .loadcss('app/css/site.css');

    const bodyTemplate=`
    <nav id="primary-nav">
        <ul class="mura-primary-nav"></ul>
    </nav>
    <div class="mura-region-container" data-region="primarycontent"></div>
    <footer>
        <!-- Create a component named "Footer" and it will render here-->
        <div class="mura-object" data-object="component" data-objectid="footer"></div>
    </footer>
    <div class="mura-html-queues"></div>
    `;

    //This is also registered in the mura.config.json
    Mura.Module.Examplejs = Mura.UI.extend({
        renderClient: function() {
            this.context.mytitle = this.context.mytitle || "The 'Title' param has not been assigned";
            this.context.targetEl.innerHTML=`<h2>${Mura.escapeHTML(this.context.mytitle)}</h2>`;
            return this;
        }
    });

    //This is also registered in the mura.config.json
    Mura.Module.Header = Mura.UI.extend({
        renderClient: async function() {
            this.context.title=this.context.title || currentContent.get('title');
            this.context.summary=this.context.summary || currentContent.get('summary');
            
            let crumbs='';
            const crumbCollection=await currentContent
                .get('crumbs')
                .then((crumbs)=>{
                    return crumbs;
                });

            crumbCollection.forEach((crumb,idx)=>{
                crumbs += `<li itemprop="itemListElement" itemscope="" itemtype="http://schema.org/ListItem" class="${(!idx)?'first':''} breadcrumb-item">
                <a itemprop="item" href="${crumb.get('url')}"><span itemprop="name">${Mura.escapeHTML(crumb.get('menutitle'))}</span></a>   
                <meta itemprop="position" content="${idx+1}">
                </li>`
            });
           

            let returnString=`
            <header>
                <div class="container">
                <nav aria-label="breadcrumb"><ol itemscope="" itemtype="http://schema.org/BreadcrumbList" id="crumblist" class="mura-breadcrumb breadcrumb">                    
                    ${crumbs}
                </ol></nav>
                <h1>${Mura.escapeHTML(this.context.title)}</h1>
                ${(this.context.summary && this.context.summary != '<p></p>') ? this.context.summary:''}
                </div>
            </header>`;

            this.context.targetEl.innerHTML=returnString;
            return this;
        }
    });

    //This is also registered in the mura.config.json
    Mura.Module.Examplecollectionlayout = Mura.UI.extend({
        renderClient: function() {
            if(this.context.collection.length()){
                let returnString="<ul>";
                    this.context.collection.forEach(function(item){
                    returnString +=`<li><a href="${Mura.escapeHTML(item.get('url'))}">${Mura.escapeHTML(item.get('menutitle'))}</a></li>`;
                });

                returnString += "</ul>";
            
                if(this.context.collection.has('first')){
                    returnString += `<button class="pagenav" data-page="first">First</button>`;
                }
                if(this.context.collection.has('previous')){
                    returnString += `<button class="pagenav" data-page="previous">Previous</button>`;
                }
                if(this.context.collection.has('next')){
                    returnString += `<button class="pagenav" data-page="next">Next</button>`;
                }
                if(this.context.collection.has('last')){
                    returnString += `<button class="pagenav" data-page="last">Last</button>`;
                }
                   
                this.context.targetEl.innerHTML=returnString;

                let self=this;

                Mura(this.context.targetEl)
                    .find(".pagenav")
                    .on("click",function(){
                        self.goToPage(Mura(this).data('page'));
                    });

            } else {
                this.context.targetEl.innerHTML="<p>No matching content found</p>";
            }
        
            return this;
        },
        goToPage:function(link){
            link=link || 'missing';
            if(this.context.collection.has(link)){
                this.context.collection.get(link).then((collection)=>{
                    this.context.collection=collection;
                    this.renderClient();
                })
            }
        }
    });

    function render(){
        let hash= location.hash || '#';
        
        function buildNav(container,parentid){
            container.html('');

            if(parentid==Mura.homeid){
                container.html('<li><a href="./#">Home</a></li>');
            }

            Mura.getEntity('content')
            Mura.getFeed('content')
            .where()
            .prop('parentid').isEQ(parentid)
            .getQuery()
            .then(function(collection){
            collection.forEach(function(item){
                container.append('<li><a href="#' + item.get('filename') + '">' + item.get('menutitle') + '</a></li>');
            });
            })
        }
        
        let query=Mura.getQueryStringParams();
    
        Mura.renderFilename(
            hash.split('#')[1],
            Mura.extend(Mura.getQueryStringParams(),{expand:"crumbs"})
        ).then(function(content){

            currentContent=content;

            Mura('.mura-html-queues').html(content.get('htmlheadqueue') + content.get('htmlfootqueue'));

            Mura.extend(Mura,Mura.extend(content.get('config')));
        
            if (query.doaction && query.doaction=='logout'){
                Mura.logout().then( function(){
                    location.href="./";
                });
            } else if(query.display 
                || (
                    content.get('type')=='Page' 
                    && (
                        content.get('subtype')=='Blog Post' || content.get('subtype')=='Article'
                    )
                )){
                Mura('.mura-region-container[data-region="primarycontent"]').html(content.get('body'));
            } else {
                Mura('.mura-region-container').each(function(){
                let item=Mura(this);
                item.html(
                    content.renderDisplayRegion(
                    item.data('region')
                    )
                );
            })
        }
       
        buildNav(
            Mura('.mura-primary-nav'),
            Mura.homeid
        );

        Mura(document).processMarkup();

    });
    }

    Mura('body').append(bodyTemplate);
    render();

    Mura(window).on('hashchange', render);

});