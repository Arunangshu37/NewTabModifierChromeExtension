# Usage notes

## Installation:
Follow the steps to install and get going with the extension
- Clone the repo or download the files in the system
- Extract bootstrap-5.3.2-dist.zip file in the same directory where the zip file is
- Install the extension following steps mentioned [here](https://support.google.com/chrome/a/answer/2714278?hl=en#:~:text=Step%202%3A%20Test%20the%20app%20or%20extension)

	```
	Note: Please be aware the link mentioned here might change in future. It is advised to search in google and follow the latest instruction for installing extension in chrome from official documentation.
	```
- Once you have loaded the extension in chrome when opening a new tab you should see the new tab page that the extension has to display. 👍

------------------
>  Note: To display a new background image and a `marquee` quote at the top of the new tab page free apis are used 

1. [Image api for a new background image when new tab is opened](https://github.com/Arunangshu37/NewTabModifierChromeExtension/blob/5cb87e5a88205cb3ad733ba64b97c61f8c839e5b/scripts/main.js#L17C9-L17C60) 
2. [Quote api at the top of new tab page](https://github.com/Arunangshu37/NewTabModifierChromeExtension/blob/5cb87e5a88205cb3ad733ba64b97c61f8c839e5b/scripts/main.js#L30C9-L30C46)

[there might be a delay in getting a new image or quote based on the internet speed. Addressing of this issue is a WIP]