window.addEventListener('load', function(){
	const canvas = document.getElementById('canvas1');
	const ctx = canvas.getContext('2d');
	canvas.width = 1400;
	canvas.height = 1000;

	class Game
	{
		constructor(width, height, context, element)
		{
			this.width = width;
			this.height = height;
			this.id = 0;
			this.entities = [];
			this.keys = [];
			this.input = new InputHandler(this);
			this.vx = 0;
			this.vy = 0;
			this.frame = 0;
			this.paused = true;
			this.context = context;
			this.reference;
			this.camera = new Camera(canvas.width, canvas.height);
			this.mapView = false;
			this.UI = new UI(width, height, element);
		}

		update(dt)
		{
			this.frame++;
			this.entities = this.entities.filter(
							entity => !entity.markedForDeletion);

			this.entities.forEach(entity => 
			{
				entity.update(dt, this);
			});
		}

		draw()
		{
			this.camera.start(this.context);
			this.entities.forEach(entity => 
			{
				entity.draw(this.context);
			});
			this.camera.end(this.context);
			this.UI.draw(this.context);

		//	this.test1.draw(this.context);
		//	this.test2.draw(this.context);
		}

		addEntity()
		{
			let entity = new Entity(this);
			this.entities.push(entity);
			return entity;
		}

		getEntitiesWithComponent(name)
		{
			return this.entities.filter(function(entity)
			{
				return entity.hasComponent(name);
			});
		}
	}

	class PlayerComponent extends Component
	{
		constructor()
		{
			super();
		}

		update(dt, game)
		{
			let speed = 0;

			//handle motion
			if(game.keys.includes('ArrowUp'))
			{
				if(this.entity.hasComponent('Controller'))
					this.entity.getComponent('Controller').setTarget(10,0,0);
			}
			else if(game.keys.includes('ArrowDown'))
			{
				if(this.entity.hasComponent('Controller'))
					this.entity.getComponent('Controller').setTarget(-10,0,0);

			}
			else if(game.keys.includes('ArrowLeft'))
			{
				if(this.entity.hasComponent('Controller'))
					this.entity.getComponent('Controller').rotate(-0.02);
			}
			else if(game.keys.includes('ArrowRight'))
			{
				if(this.entity.hasComponent('Controller'))
					this.entity.getComponent('Controller').rotate(0.02);
			}
			else if(game.keys.includes('m'))
			{
				game.mapView = !game.mapView;
				if(game.mapView) game.camera.scale = 0.2;
				else 			 game.camera.scale = 1;
				game.keys.splice(game.keys.indexOf('m'),1);
			}

			this.entity.position.y += speed;
		}
	}

	let game = new Game(canvas.width, canvas.height, ctx, 
						document.getElementById("canvas1"));

	let play = game.addEntity();
	play.addComponent(new PlayerComponent());
	play.addComponent(new PhysicsComponent(1.0));
	play.addComponent(new Controller());

	game.reference = play;

	let b1 = play.addEntity();
	b1.addComponent(new PhysicsComponent(1.0));
	b1.position.y += 50;
	b1.addComponent(new RCS());

	let b2 = play.addEntity();
	b2.addComponent(new PhysicsComponent(1.0));
	b2.position.y -= 50;
	b2.addComponent(new RCS());

	let b3 = play.addEntity();
	b3.addComponent(new BlockRenderComponent(50, 50, 'red'));
	b3.addComponent(new PhysicsComponent(1.0));

	play.vx -= 0; //30.5;
	play.vy += 10; //30.5;

	let planet1 = game.addEntity();
	planet1.addComponent(new BlockRenderComponent(50, 50, 'red'));
	planet1.addComponent(new PhysicsComponent(2000.0));
	planet1.position.x += canvas.width/2 - 500;
	
	let body1 = new GravityNode(2000.0, planet1);
	let body2 = new GravityNode(1.0, play, body1);
	body1.addSatellite(body2);
	play.getComponent('PhysicsComponent').keplerBody = body2;
	planet1.getComponent('PhysicsComponent').keplerBody = body1;


/*
	planet1.vy -= 70;

	play.vy = planet1.vy - 30;
	
	

	let planet2 = game.addEntity();
	planet2.addComponent(new BlockRenderComponent(50, 50, 'red'));
	planet2.addComponent(new PhysicsComponent(1000.0));
	planet2.position.x += canvas.width*2;
	planet2.vy -= 30;

	let sun = game.addEntity();
	sun.addComponent(new BlockRenderComponent(50, 50, 'red'));
	sun.addComponent(new PhysicsComponent(100000.0));
	sun.position.x -= canvas.width;
*/

	let lastTime = 0;

	function animate(timeStamp){
		const deltaTime = timeStamp - lastTime;
		lastTime = timeStamp;

		if(!game.paused)
		{
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			game.draw();
			game.update(deltaTime);
		}
		requestAnimationFrame(animate);
	}

	animate(0);
});
