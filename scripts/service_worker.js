console.log('Service worker initialized');
const broadcast = new BroadcastChannel('channel-123');
broadcast.onmessage = (event) => {
	if (event.data && event.data.type == 'MSG_ID') 
	{
		fetch('https://source.unsplash.com/random/1280x720/?nature').then(async (response) => {
			const blobImage = await response.blob();
			var reader = new FileReader();
			reader.readAsDataURL(blobImage);
			reader.onloadend = () => {
				console.log('Data sent for background image');
				broadcast.postMessage({ type: 'MSG_BACKGROUND_IMAGE', backGroundImageData: reader.result });
			}
		});


		fetch('https://api.quotable.io/quotes/random').then(async (response) => {
			const jsonData = await response.json();
			const quote = `${jsonData[0].content} - ${jsonData[0].author}`;
			broadcast.postMessage({ type: 'MSG_QUOTE', quote: quote });
		});
	}
}