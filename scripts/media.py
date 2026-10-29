import os, sys
from PIL import Image
U="/mnt/user-data/uploads/Portfolio Website"
A=U+"/Portoflio of Emma Dodd"
D=U+"/output/exact-make-recreation/dist"
M=U+"/output/portfolio-mockups"
RB=A+"/Brand and Editorial/Personal Project- Roundbird Coffee"
UNF=A+"/Brand and Editorial/Completed UNF Planbook/Power of 4 Mockups (UNF PLANBOOK)"
jobs = {
 # site chrome
 "emma-headshot": (D+"/images/emma-headshot.png", 1100),
 "mail-icon": (D+"/images/mail-icon.png", 500),
 "girl-with-ideas": (U+"/NEW Images/Im just a girl with ideas.jpg", 600),
 # commercial lending
 "cl-box": (M+"/03-commercial-lending-kit.png", 2000),
 "cl-spreads": (M+"/04-commercial-lending-spreads.png", 2000),
 "cl-postcard": (M+"/10-commercial-postcard-front-back.png", 2000),
 "cl-package-photo": (U+"/NEW Images/Commercial Lending Image 1.jpeg", 1200),
 "cl-mailing-day": (M+"/16-mailing-process-redacted.png", 900),
 # treasury
 "tm-social": (D+"/projects/fee-advantage-cover.png", 2000),
 "tm-social-alt": (M+"/14-fee-social-alternate-collage.png", 1600),
 "tm-tooth": (D+"/projects/dental-mailer.png", 2000),
 "tm-landing": (M+"/13-fee-review-landing-page.png", 1600),
 "tm-sun-print": (D+"/projects/money-leaking-ad.png", 2000),
 "tm-gator-print": (M+"/12-alligator-editorial-print.png", 1600),
 "tm-gator-landing": (D+"/projects/alligator-landing-page.png", 2000),
 # web
 "web-checking": (D+"/projects/checking-landing-page.png", 2000),
 "web-collection": (D+"/projects/website-collection.jpg", 2000),
 "web-mobile-wallet": (A+"/Website and Digital/Landing Pages/Mobile Wallet.png", 1200),
 "web-uad": (A+"/Website and Digital/Landing Pages/UAD 3.6 Transiton Landing Page.png", 1200),
 "web-faq": (A+"/Website and Digital/Website Screens/Example of FAQS.png", 1040),
 "web-jdr-ad": (D+"/projects/business-banking-ad.png", 2000),
 "web-jdr-landing": (A+"/Campaigns/JDR 2026/JDR ad landing page.png", 1400),
 # roundbird
 "rb-cup": (RB+"/ROundbird MOCKUPS 2026/image.jpg", 1400),
 "rb-kit-1": (RB+"/ROundbird MOCKUPS 2026/Roundbird Coffee brand kit 1.png", 1080),
 "rb-kit-2": (RB+"/ROundbird MOCKUPS 2026/Roundbird Coffee brand kit 2.png", 1080),
 "rb-closeup": (RB+"/ROundbird MOCKUPS 2026/Roundbird Coffee Closeup.jpg", 1728),
 "rb-shop": (RB+"/ROundbird MOCKUPS 2026/Roundbird Shop.jpg", 1008),
 "rb-wine": (RB+"/ROundbird MOCKUPS 2026/Roundbird Wine Glasses.jpg", 928),
 "rb-hat": (RB+"/ROundbird MOCKUPS 2026/Roundbird merch hat.jpg", 1152),
 "rb-social-1": (RB+"/ROundbird MOCKUPS 2026/Social Post 1.jpg", 1080),
 "rb-social-2": (RB+"/ROundbird MOCKUPS 2026/Social Post 2.jpg", 1080),
 "rb-social-combined": (RB+"/ROundbird MOCKUPS 2026/Mockup Stagnent Social Posts Combined.png", 1080),
 "rb-pattern": (RB+"/Pattern.png", 1536),
 "rb-illustrations": (RB+"/Illustrations.png", 1536),
 "rb-logo": (RB+"/Roundbird Logo-01.png", 1600),
 "rb-logo-lower": (RB+"/Roundbird Logo-02.png", 1600),
 "rb-mark": (RB+"/Roundbird Logo-03.png", 1600),
 # unf
 "unf-poster": (UNF+"/Poster Mockup.png", 1920),
 "unf-chalk": (UNF+"/Chalk Takeover Mockup.png", 1920),
 "unf-banner": (UNF+"/ADV Banner Mockup.png", 1200),
 "unf-table-tent": (UNF+"/Table Tent Mockup.png", 1920),
 "unf-passport-front": (A+"/Campaigns/Passport/1.png", 1000),
 "unf-passport-back": (A+"/Campaigns/Passport/2.png", 1000),
}
out="public/media"; tot_in=tot_out=0
for name,(src,w) in jobs.items():
    im=Image.open(src)
    keep_alpha = im.mode in ("RGBA","LA","P") and name in ("emma-headshot","mail-icon")
    im = im.convert("RGBA" if keep_alpha else "RGB")
    if name.startswith("rb-logo") or name=="rb-mark":
        bbox=Image.eval(im.convert("L"),lambda p:255-p).getbbox(); im=im.crop((max(0,bbox[0]-150),max(0,bbox[1]-150),bbox[2]+150,bbox[3]+150))
    if im.width>w: im=im.resize((w,round(im.height*w/im.width)),Image.LANCZOS)
    p=f"{out}/{name}.webp"; im.save(p,"WEBP",quality=82,method=6)
    tot_in+=os.path.getsize(src); tot_out+=os.path.getsize(p)
    print(f"{name:22s} {im.size} {os.path.getsize(p)//1024}KB")
print("total", tot_in//1048576,"MB ->", tot_out//1048576, "MB")
