phantom = require 'phantom'
console.log 'yo'

sitePage = null
phInstance = null

phantom.create()
  .then((instance) ->
    console.log 'instance'
    phInstance = instance
    return instance.createPage()
  )
  .then((page) ->
    console.log 'set content', page
    sitePage = page
    page.property('viewportSize', {width: 888, height: 600})
    page.setContent("""
    <html>
    <head>
    <link href="//fonts.googleapis.com/css?family=Lato:700|Yrsa:300,700" rel="stylesheet" type="text/css">
    <style>/*! normalize.css v4.1.1 | MIT License | github.com/necolas/normalize.css */html{font-family:sans-serif;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%}body{margin:0}article,aside,details,figcaption,figure,footer,header,main,menu,nav,section,summary{display:block}audio,canvas,progress,video{display:inline-block}audio:not([controls]){display:none;height:0}progress{vertical-align:baseline}[hidden],template{display:none}a{background-color:transparent;-webkit-text-decoration-skip:objects}a:active,a:hover{outline-width:0}abbr[title]{border-bottom:none;text-decoration:underline;text-decoration:underline dotted}b,strong{font-weight:inherit;font-weight:bolder}dfn{font-style:italic}h1{font-size:2em;margin:.67em 0}mark{background-color:#ff0;color:#000}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}img{border-style:none}svg:not(:root){overflow:hidden}code,kbd,pre,samp{font-family:monospace,monospace;font-size:1em}figure{margin:1em 40px}hr{box-sizing:content-box;height:0;overflow:visible}button,input,optgroup,select,textarea{font:inherit;margin:0}optgroup{font-weight:700}button,input{overflow:visible}button,select{text-transform:none}[type=reset],[type=submit],button,html [type=button]{-webkit-appearance:button}[type=button]::-moz-focus-inner,[type=reset]::-moz-focus-inner,[type=submit]::-moz-focus-inner,button::-moz-focus-inner{border-style:none;padding:0}[type=button]:-moz-focusring,[type=reset]:-moz-focusring,[type=submit]:-moz-focusring,button:-moz-focusring{outline:1px dotted ButtonText}fieldset{border:1px solid silver;margin:0 2px;padding:.35em .625em .75em}legend{box-sizing:border-box;color:inherit;display:table;max-width:100%;padding:0;white-space:normal}textarea{overflow:auto}[type=checkbox],[type=radio]{box-sizing:border-box;padding:0}[type=number]::-webkit-inner-spin-button,[type=number]::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}[type=search]::-webkit-search-cancel-button,[type=search]::-webkit-search-decoration{-webkit-appearance:none}::-webkit-input-placeholder{color:inherit;opacity:.54}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}html{font-size:112.5%;line-height:1.77778em;box-sizing:border-box;overflow-y:scroll;}*{box-sizing:inherit;}*:before{box-sizing:inherit;}*:after{box-sizing:inherit;}body{color:hsl(0,0%,0%);font-family:Open Sans,sans-serif;font-weight:400;word-wrap:break-word;}img{max-width:100%;margin:0;padding:0;margin-bottom:1.77778rem;}h1{margin:0;padding:0;margin-bottom:1.77778rem;color:hsl(0,0%,0%);font-family:Domine,sans-serif;font-weight:700;text-rendering:optimizeLegibility;font-size:2rem;line-height:2.66667rem;}h2{margin:0;padding:0;margin-bottom:1.77778rem;color:hsl(0,0%,0%);font-family:Domine,sans-serif;font-weight:700;text-rendering:optimizeLegibility;font-size:1.7411rem;line-height:2.66667rem;}h3{margin:0;padding:0;margin-bottom:1.77778rem;color:hsl(0,0%,0%);font-family:Domine,sans-serif;font-weight:700;text-rendering:optimizeLegibility;font-size:1.51572rem;line-height:1.77778rem;}h4{margin:0;padding:0;margin-bottom:1.77778rem;color:hsl(0,0%,0%);font-family:Domine,sans-serif;font-weight:700;text-rendering:optimizeLegibility;font-size:1.31951rem;line-height:1.77778rem;}h5{margin:0;padding:0;margin-bottom:1.77778rem;color:hsl(0,0%,0%);font-family:Domine,sans-serif;font-weight:700;text-rendering:optimizeLegibility;font-size:1.1487rem;line-height:1.77778rem;}h6{margin:0;padding:0;margin-bottom:1.77778rem;color:hsl(0,0%,0%);font-family:Domine,sans-serif;font-weight:700;text-rendering:optimizeLegibility;font-size:1rem;line-height:1.77778rem;}hgroup{margin:0;padding:0;margin-bottom:1.77778rem;}ul{margin:0;padding:0;margin-bottom:1.77778rem;list-style-position:outside;list-style-image:none;margin-left:1.77778rem;}ol{margin:0;padding:0;margin-bottom:1.77778rem;list-style-position:outside;list-style-image:none;margin-left:1.77778rem;}dl{margin:0;padding:0;margin-bottom:1.77778rem;}dd{margin:0;padding:0;margin-bottom:1.77778rem;}p{margin:0;padding:0;margin-bottom:1.77778rem;}figure{margin:0;padding:0;margin-bottom:1.77778rem;}pre{margin:0;padding:1.77778rem;margin-bottom:1.77778rem;font-size:1em;line-height:1.77778rem;background:hsl(0,0%,97%);border-radius:3px;overflow:auto;}table{margin:0;padding:0;margin-bottom:1.77778rem;font-size:1rem;line-height:1.77778rem;border-collapse:collapse;width:100%;}fieldset{margin:0;padding:0;margin-bottom:1.77778rem;}blockquote{margin:0;padding:0;margin-bottom:1.77778rem;margin-right:1.77778rem;margin-left:0;font-size:1.16667rem;line-height:1.77778rem;color:hsl(0,0%,41%);font-style:italic;padding-left:1.44444rem;border-left:0.33333rem solid hsl(0,0%,10%);}form{margin:0;padding:0;margin-bottom:1.77778rem;}noscript{margin:0;padding:0;margin-bottom:1.77778rem;}iframe{margin:0;padding:0;margin-bottom:1.77778rem;}hr{margin:0;padding:0;margin-bottom:calc(1.77778rem - 1px);background:hsl(0,0%,80%);border:none;height:1px;}address{margin:0;padding:0;margin-bottom:1.77778rem;}b{font-weight:700;}strong{font-weight:700;}dt{font-weight:700;}th{font-weight:700;}li{margin-bottom:0.88889rem;}ol li{padding-left:0;}ul li{padding-left:0;}li > ol{margin-left:1.77778rem;margin-bottom:0.88889rem;margin-top:0.88889rem;}li > ul{margin-left:1.77778rem;margin-bottom:0.88889rem;margin-top:0.88889rem;}code{font-size:0.85rem;line-height:1.77778rem;}kbd{font-size:0.85rem;line-height:1.77778rem;}samp{font-size:0.85rem;line-height:1.77778rem;}abbr{border-bottom:1px dotted hsl(0,0%,50%);cursor:help;}acronym{border-bottom:1px dotted hsl(0,0%,50%);cursor:help;}abbr[title]{border-bottom:1px dotted hsl(0,0%,50%);cursor:help;text-decoration:none;}thead{text-align:left;}td,th{text-align:left;border-bottom:1px solid hsl(0,0%,88%);padding-left:1.18519rem;padding-right:1.18519rem;padding-top:0.88889rem;padding-bottom:calc(0.88889rem - 1px);}th:first-child,td:first-child{padding-left:0;}th:last-child,td:last-child{padding-right:0;}@media only screen and (max-width:768px){h1{font-size:1.61803rem;line-height:2.66667rem;}h2{font-size:1.46957rem;line-height:1.77778rem;}h3{font-size:1.33473rem;line-height:1.77778rem;}h4{font-size:1.21226rem;line-height:1.77778rem;}h5{font-size:1.10103rem;line-height:1.77778rem;}h6{font-size:1rem;line-height:1.77778rem;}}tt,code{background-color:rgba(0,0,0,0.04);border-radius:3px;font-family:"Inconsolata",Consolas,"Liberation Mono",Menlo,Courier,monospace;padding:0;padding-top:0.2em;padding-bottom:0.2em;}pre code{background:hsl(0,0%,97%);}code:before,code:after,tt:before,tt:after{letter-spacing:-0.2em;content:" ";}pre code:before,pre code:after,pre tt:before,pre tt:after{content:"";}a{color:#ff5700;text-decoration:none;}a:hover,a:active{color:hsl(0,0%,0%);}blockquote > :last-child{margin-bottom:0;}blockquote cite{font-size:1rem;line-height:1.77778rem;color:hsl(0,0%,0%);font-style:400;}blockquote cite:before{content:"â ";}@media only screen and (max-width:480px){html{font-size:100%;line-height:1.7775em;}blockquote{margin-left:-1.33333rem;margin-right:0;padding-left:1rem;}}</style>
    </head>
    <body
      style="padding: 2.66667rem 1.33333rem;"
    >
    <h1>Richard Hamming on Luck</h1>
    <p>From Richard Hamming's classic and must-read talk, "You and Your Research".</p>
    <blockquote>
    <p>
    There is indeed an element of luck, and no, there isn't. The prepared mind sooner or later finds something important and does it. So yes, it is luck. The particular thing you do is luck, but that you do something is not.
    </p>
    </blockquote>
    <em>Posted April 9, 2011</em>
    </body>
    </html>
    """, 'http://localhost:8888/')
    setTimeout((() ->
      page.render('test.png')
      sitePage.close()
      phInstance.close()
      phantom.exit()
      process.exit()
    ), 1500)
    console.log 'set content', page
    console.log page.evaluate (err, response) ->
      if err
        console.log err

      console.log 'response', response
  )
  #.then((status) ->
    #console.log 'status', status
    #return sitePage.property('content')
  #)
  #.then((content) ->
    #console.log 'content', content
    #sitePage.close()
    #phInstance.close()
  #)
