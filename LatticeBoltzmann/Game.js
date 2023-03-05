window.addEventListener('load', function(){
	const canvas = document.getElementById('canvas');
	const ctx = canvas.getContext('2d');
	canvas.width = 1400;
	canvas.height = 1000;
	

	class Game
	{
		constructor(width, height, context, element)
		{
			this.paused = false;
			this.width = width;
			this.height = height;
			this.lbm = new LBM(width, height, 70, 50);
		}

		update(dt)
		{
			this.frame++;
			this.lbm.update(dt);
		}

		draw(context, paused)
		{
			this.lbm.draw(context);
		}
	}

	let game = new Game(canvas.width, canvas.height, ctx, canvas);
	let lastTime = 0;

	function animate(timeStamp){
		const deltaTime = timeStamp - lastTime;
		lastTime = timeStamp;

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		game.draw(ctx);
		if(!game.paused)
		{
			game.update(deltaTime);
		}

		requestAnimationFrame(animate);
	}

	animate(0);

});
