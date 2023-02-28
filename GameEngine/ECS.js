


class Entity
{
	constructor(game)
	{
		this.game = game;
		this.id = game.id++;
		this.tags = new Set();
		this.components = {};
		this.markedForDeletion = false;
		this.position = new Vector(0,0);
		this.theta = 0;
		this.vx = 0;
		this.vy = 0;
		this.vz = 0;
		this.entities = [];
		this.depth = 0;
		this.cog = new Vector(0,0);
		this.parentEntity;
	}

	addComponent(component)
	{
		component.entity = this;
		let name = component.constructor.name;
		this.components[name] = component;
		this.tags.add(name);

		this.onComponentAdded(component);	
	}


	onComponentAdded(component)
	{
		if(this.parentEntity != undefined)
		{
			this.parentEntity.onComponentAdded(component);	
		}
		else
		{
			for(const item of this.tags)
			{
				this.components[item].onComponentAdded(component);
			}
		}
	}

	addEntity()
	{
		let entity = new Entity(this.game);
		entity.depth = this.depth + 1;
		entity.parentEntity = this;
		this.entities.push(entity);

		return entity;
	}

	update(dt, game)
	{
		for(const item of this.tags)
		{
			if(this.components[item].markedForDeletion)
			{
				this.tags.delete(tag);
				delete this.components[item];
			}
		}
	
		for(const item of this.tags)
		{
			this.components[item].update(dt, game);
		}

		this.entities = this.entities.filter(
							entity => !entity.markedForDeletion);

		this.entities.forEach(entity => 
		{
			entity.update(dt, this);
		});

		if(game.reference != undefined)
		{
			this.position.x -= dt/1000 * game.reference.vx;
			this.position.y -= dt/1000 * game.reference.vy;
		}


		this.position.x += dt/1000 * this.vx;
		this.position.y += dt/1000 * this.vy;
		this.theta += dt/1000 * this.vz;
	}

	draw(context)
	{
		for(const item of this.tags)
		{
			this.components[item].draw(context);
		}

		let rotCog = new Vector(this.cog.x, this.cog.y);
		rotCog.relativeToAbsolute(this.theta,
								  this.position.x,
								  this.position.y);

//		context.translate(this.position.x, this.position.y);
		context.translate(rotCog.x, rotCog.y);
		context.rotate(this.theta);

		this.entities.forEach(entity => 
		{
			entity.draw(context);
		});

		context.rotate(-this.theta);
		context.translate(-rotCog.x, -rotCog.y);
//		context.translate(-this.position.x, -this.position.y);
	}

	hasComponent(key)
	{
		return this.components[key] != undefined;
	}

	getComponent(key)
	{
		return this.components[key];
	}

	distance(entity)
	{
		let dx = this.position.x - entity.position.x;
		let dy = this.position.y - entity.position.y;
		return Math.sqrt(dx*dx + dy*dy);
	}
}

class Component
{
	constuctor()
	{
		this.markedForDeletion = false;
	}

	update(dt, game, entity)
	{}

	draw(context)
	{}

	onComponentAdded(component)
	{}
}

class RenderComponent extends Component
{
	constructor(imageName, width, height, nbFrames, fps, offsetY)
	{
		super();
		this.image = document.getElementById(imageName);
		this.width = width;
		this.height = height;
		this.frameX = 0;
		this.frameY = offsetY;
		this.interval = 0;
		if(fps != 0) this.interval = 1000/fps;
		this.timer = 0;
		this.nbFrames = nbFrames;
	}

	update(dt, game)
	{
		if(this.interval != 0 && this.nbFrames > 1)
		{
			if(this.timer > this.interval){
				if(this.frameX > this.nbFrames) this.frameX = 0;
				this.frameX++;
				this.timer = 0;
			}else{
				this.timer += dt;
			}
		}
	}

	draw(context)
	{
		context.translate(this.entity.position.x, 
						  this.entity.position.y);
		context.rotate(this.entity.theta);
		context.drawImage(this.image, 
						  this.frameX*this.width, this.frameY*this.height, 
						  this.width, this.height, 
						  this.width*-0.5, this.height*-0.5, 
						  this.width, this.height);
		context.rotate(-this.entity.theta);
		context.translate(-this.entity.position.x, 
						  -this.entity.position.y);
	}
}

class BlockRenderComponent extends Component
{
	constructor(width, height, color)
	{
		super();
		this.width = width;
		this.height = height;
		this.color = color;
	}

	draw(context)
	{
		context.translate(this.entity.position.x, this.entity.position.y);
		context.rotate(this.entity.theta);
		context.fillStyle = this.color;
//		context.fillRect(this.width*-0.5, this.height*-0.5, 
//						  this.width, this.height);
		context.fillStyle = 'black';
		context.lineWidth = 3;
		context.strokeRect(this.width*-0.5, this.height*-0.5, 
					 this.width, this.height);
		context.rotate(-this.entity.theta);
		context.translate(-this.entity.position.x, -this.entity.position.y);
	}
}

class Camera
{
	constructor(width, height)
	{
		this.position = new Vector(width * 0.5, height * 0.5);
		this.scale = 1.0;
		this.theta = 0;
	}

	start(context)
	{
		context.translate(this.position.x, this.position.y);
		context.scale(this.scale, this.scale);
		context.rotate(-this.theta);
	}

	end(context)
	{
		context.rotate(this.theta);
		context.scale(1.0/this.scale, 1.0/this.scale);
		context.translate(-this.position.x, -this.position.y);
	}
}
