
class Animation{
	constructor(fps, nbFrames){
		this.fps = fps;
		this.nbFrames = nbFrames;
		this.frame = 0;
	}

	draw(context){
	}
}

class Particle{
	constructor(game, x, y){
		this.game = game;
		this.x = x;
		this.y = y;
		this.image = document.getElementById('gears');
		this.frameX = Math.floor(Math.random() * 3);
		this.frameY = Math.floor(Math.random() * 3);
		this.spriteSize = 50;
		this.sizeModifier = (Math.random() * 0.5 + 0.5).toFixed(1);
		this.size = this.spriteSize*this.sizeModifier;
		this.speedX = Math.random()*6 - 3;
		this.speedY = Math.random()*-15;
		this.gravity = 0.5;
		this.markedForDeletion = false;
		this.angle = 0;
		this.va = Math.random()*0.2 - 0.1;
		this.bounced = 0;
		this.bottomBounceBoundary = Math.random() * 80 + 60;
	}

	update(){
		this.angle += this.va;
		this.speedY += this.gravity;
		this.x -= this.speedX + this.game.speed;
		this.y += this.speedY;
		if(this.y > this.game.height + this.size || this.x < 0 - this.size) this.markedForDeletion = true;
		if(this.y > this.game.height - this.bottomBounceBoundary && this.bounced < 2){
			this.bounced++;
			this.speedY *= -0.5;
		}
	}

	draw(context){
		context.save();
		context.translate(this.x, this.y);
		context.rotate(this.angle);
		
		context.drawImage(this.image, this.frameX * this.spriteSize, this.frameY*this.spriteSize, this.spriteSize, this.spriteSize, this.size*-0.5, this.size*-0.5, this.size, this.size);
		context.restore();
	}
}

class Explosion{
	constructor(game, x, y){
		this.game = game;
		this.x = x;
		this.y = y;
		this.frameX = 0;
		this.spriteWidth = 200;
		this.spriteHeight = 200;
		this.width = this.spriteWidth;
		this.height = this.spriteHeight;
		this.x = this.x - this.width * 0.5;
		this.y = this.y - this.height * 0.5;			
		this.timer = 0;
		this.fps = 30;
		this.interval = 1000/this.fps;
		this.markedForDeletion = false;
		this.maxFrame = 8;
	}

	update(deltaTime){
		this.x -= this.game.speed;
		if(this.timer > this.interval){
			this.frameX++;
			this.timer = 0;
		}else{
			this.timer += deltaTime;
		}
		if(this.frameX > this.maxFrame) this.markedForDeletion = true;
	}

	draw(context){
		context.drawImage(this.image, this.frameX * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
	}
}

class SmokeExplosion extends Explosion{
	constructor(game, x, y){
		super(game, x, y);
		this.image = document.getElementById('smokeExplosion');
	}
}

class FireExplosion extends Explosion{
	constructor(game, x, y){
		super(game, x, y);
		this.image = document.getElementById('fireExplosion');
	}	
}


