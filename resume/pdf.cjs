const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage();
await p.goto('file://'+path.resolve(__dirname,'resume.html'));await p.evaluate(()=>document.fonts.ready);
const h=await p.evaluate(()=>document.querySelector('.page').scrollHeight);console.log('page height px',h,'(limit 1056)');
await p.pdf({path:path.resolve(__dirname,'../public/Emma-Dodd-Resume.pdf'),format:'Letter',printBackground:true,preferCSSPageSize:true});
await p.setViewportSize({width:816,height:1056});await p.screenshot({path:process.argv[2],fullPage:true});await b.close();})();
