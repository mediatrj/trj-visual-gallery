TRJ VISUAL GALLERY — QUICK SETUP

1) Start website:
   Double-click START_WEBSITE.bat
   (Python must be installed.)

2) Add photo folders manually:
   media/photos/Your Folder Name/   -> put photos here
   media/videos/Your Folder Name/   -> put videos here
   media/nature/Your Folder Name/   -> put nature photos here
   media/wildlife/Your Folder Name/ -> put wildlife photos here
   Then double-click UPDATE_MEDIA_INDEX.bat and refresh the website.

3) Edit promo codes:
   Open config.js in Notepad and edit promoCodes.
   Current codes: T5467, T3465, T8379, T9826, T7839, T9239, T8722, T9282

4) Edit Help Assistant questions/answers:
   Open config.js and edit helpQuestions.

5) Edit Nature / Wildlife / About text:
   Open index.html in Notepad and search the text you want to replace.

6) Access rules:
   FREE: photo downloads wait briefly, are reduced in size/quality and get TRJ Visual Gallery watermark; Help Assistant replies are delayed.
   PRO: original image download, no watermark, fast assistant, whole-folder ZIP download.

7) Important browser note:
   The website cannot automatically scan new folders by itself for security reasons. UPDATE_MEDIA_INDEX.bat creates the list after you add files.
   Whole-folder ZIP uses JSZip from a CDN, so internet is needed for that feature unless JSZip is later bundled locally.

8) Home video:
   assets/home-video.mp4. Replace this file with another MP4 using the SAME filename to change the background video.

9) Logos:
   assets/gallery-logo.png
   assets/academy-logo.png
   assets/media-logo.png

10) WhatsApp BUY button:
   Sends plan activation request to +94 77 547 6288.
