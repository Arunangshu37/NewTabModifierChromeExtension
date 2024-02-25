

let getVersionPort;
self.addEventListener('message', (event) => {
	if (event.data && event.data.type === 'INIT_PORT') {
		getVersionPort = event.ports[0];
	  }

	if (event.data && event.data.type === 'START_PROCESS') {
		fetch('https://source.unsplash.com/random/1280x720/?nature').then(async (response) => {
			const blobImage = await response.blob();
			var reader = new FileReader();
			reader.readAsDataURL(blobImage);
			reader.onloadend = () => {
				getVersionPort.postMessage({ type: 'MSG_BACKGROUND_IMAGE', backGroundImageData: reader.result });
			}
		});


		fetch('https://api.quotable.io/quotes/random').then(async (response) => {
			const jsonData = await response.json();
			const quote = `${jsonData[0].content} - ${jsonData[0].author}`;
			getVersionPort.postMessage({ type: 'MSG_QUOTE', quote: quote });
		});
	}
});