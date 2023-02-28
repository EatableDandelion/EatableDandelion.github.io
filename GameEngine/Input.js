class InputHandler{
	constructor(game){
		this.game = game;
		window.addEventListener('keydown', e => {
			if(this.game.keys.indexOf(e.key) == -1)
				this.game.keys.push(e.key);
			if(e.key == 'p') this.game.paused = !this.game.paused;
		});

		window.addEventListener('keyup', e => {
			if(this.game.keys.indexOf(e.key) > -1){
				this.game.keys.splice(this.game.keys.indexOf(e.key),1);
			}
		});
	}	
}
