class RCS extends Component
{
	constructor()
	{
		super();
		this.width = 50;
		this.height = 50;
		this.power = 0;
		this.force = 0.1;
		this.direction = new Vector(1,0);
	}

	update(dt, game)
	{
		if(this.power < 0.01) return;
		if(this.entity.hasComponent('PhysicsComponent'))
			this.entity.getComponent('PhysicsComponent')
				.addForce(this.direction.x*this.power,
						  this.direction.y*this.power, 0, 0);

		this.power = 0.0;
	}

	draw(context)
	{
		context.translate(this.entity.position.x, this.entity.position.y);
		context.rotate(this.entity.theta);
		context.fillStyle = 'red';
		context.lineWidth = 3;
		context.strokeRect(this.width*-0.5, this.height*-0.5, 
					 this.width, this.height);

		context.beginPath();
		context.moveTo(-this.width*0.8, 0);
		context.lineTo(-this.width*0.5,this.height*0.25);
		context.lineTo(-this.width*0.5,-this.height*0.25);
		context.fill();

		context.rotate(-this.entity.theta);
		context.translate(-this.entity.position.x, -this.entity.position.y);
	}

	set(powerx, powery)
	{
		this.power = Math.sqrt(powerx*powerx + powery*powery);
		this.direction.x = powerx / this.power;
		this.direction.y = powery / this.power;
	}
}

class Controller extends Component
{
	constructor()
	{
		super();
		this.commandx = 0;
		this.commandy = 0;
		this.commandz = 0;
		this.thrusters = [];
		this.target = new Mat(3,1);
		this.targetAngle = 0;
		this.thrustMatrix = new Mat(1,3);
	}

	update(dt, game)
	{
		if(!this.entity.hasComponent('PhysicsComponent')) return;

		let physicsComponent = this.entity.getComponent('PhysicsComponent');

		let angularVelocity = this.entity.vz;
	
		let v1 = new Vector(1,0);
		v1.relativeToAbsolute(this.entity.theta, 0, 0);

		let v2 = new Vector(1,0);
		v2.relativeToAbsolute(this.targetAngle, 0, 0);
		
		let dot = v1.x * v2.x + v1.y * v2.y;

		this.target.set(2, 0, dot - angularVelocity * 0.4);


		if(this.target.get(0,0) != 0 ||
		   this.target.get(1,0) != 0 ||
		   this.target.get(2,0) != 0)
		{
			let command = this.thrustMatrix.mult(this.target);
			let i = 0;
			this.thrusters.forEach(thruster =>
			{
				thruster.set(command.get(i,0), command.get(i+1,0));
				i+=2;
			});

			this.target.set(0,0,0);
			this.target.set(1,0,0);
			this.target.set(2,0,0);
		}
	}

	rotate(dtheta)
	{
		this.targetAngle += dtheta;
	}

	setTarget(vx,vy,vz)
	{
		this.target.set(0,0,vx);
		this.target.set(1,0,vy);
		this.target.set(2,0,vz);
	}

	addThruster(thruster)
	{
		this.thrusters.push(thruster);
		this.setThrusterMatrix();
	}

	setThrusterMatrix()
	{
		let A = new Mat(3, 2*this.thrusters.length);

		let i = 0;
		this.thrusters.forEach(thruster =>
		{
			A.set(0, i, thruster.force);
			A.set(1, i+1, thruster.force);
			A.set(2, i, thruster.entity.position.y * thruster.force);
			A.set(2, i+1, -thruster.entity.position.x * thruster.force);
			i += 2;
		});

		this.thrustMatrix = A.getTranspose()
				 		  .mult((A.mult(A.getTranspose())).getInverse());

	}

	onComponentAdded(component)
	{
		if(component.constructor.name == 'RCS')
		{
			this.addThruster(component);
		}
	}
}
