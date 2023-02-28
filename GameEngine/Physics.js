
class PhysicsComponent extends Component
{
	constructor(mass)
	{
		super();
		this.mass = mass;
		this.inertia = mass;
		this.fx = 0;
		this.fy = 0;
		this.fz = 0;
		this.exertGravity = true;
		this.G = 0.0001;

	}

	update(dt, game)
	{
		if(this.entity.depth == 0) this.addGravity(game);
		if(this.entity.depth == 0)
		{
			this.updateMass();
			this.updateInertia();
		}

		this.collectInternalForces();

		if(this.keplerBody != undefined)	
		{
			if(this.fx != 0 || this.fy != 0)
				this.keplerBody.dirty = true;
		}

		this.entity.vx += dt/1000 * this.fx / this.mass;// - game.vx;
		this.entity.vy += dt/1000 * this.fy / this.mass;// - game.vy;
		this.entity.vz += dt/1000 * this.fz / this.inertia;

		this.fx = 0;
		this.fy = 0;
		this.fz = 0;

		if(this.keplerBody != undefined)
			this.keplerBody.update();

		if(this.entity.depth > 0) return;
//		this.showFutureTrajectory(game, dt);
	}

	draw(context)
	{

		if(this.entity.entities.length > 0)
		{
			context.fillStyle = 'black';
			context.lineWidth = 5;
			let cog = new Vector(0, 0);
			cog.relativeToAbsolute(this.entity.theta,
  							  	   this.entity.position.x,
							  	   this.entity.position.y);

			context.beginPath();
			context.arc(cog.x, cog.y, 5, 0, 2*Math.PI);
			context.stroke();
	
		}
		if(this.entity.depth > 0) return;
		
		if(this.keplerBody != undefined)	
			this.keplerBody.draw(context);	
	}

	addForce(fx, fy, posx, posy)
	{
		this.fx += fx;
		this.fy += fy;
		if(posx != undefined && posy != undefined)
		{
			this.fz += fx*(posy - this.entity.cog.y)
					 - fy*(posx - this.entity.cog.x);
		}
	}


	collectInternalForces()
	{
		this.entity.entities.forEach(dependent =>
		{
			if(dependent.hasComponent('PhysicsComponent'))
			{
				let dep = dependent.getComponent('PhysicsComponent');
			
				dep.collectInternalForces();

				let depForce = new Vector(dep.fx, dep.fy);

				this.fz += dep.fx*(dependent.position.y+this.entity.cog.y)
					 	 - dep.fy*(dependent.position.x+this.entity.cog.x);

				depForce.relativeToAbsolute(this.entity.theta, 0, 0);

				this.fx += depForce.x;
				this.fy += depForce.y;
				this.fz += dep.fz;


				dep.fx = 0;
				dep.fy = 0;
				dep.fz = 0;

			}
		});
	}

	addGravity(game)
	{
		let entities = game.getEntitiesWithComponent('PhysicsComponent');

		let wells = entities.filter(entity => 
				entity.getComponent('PhysicsComponent').exertGravity);


		wells.forEach(entity => 
		{
			if(entity.id != this.entity.id)
			{
				let force = getGravity(entity.position, 
											this.entity.position,
							entity.getComponent('PhysicsComponent').mass,
							this.mass);

				this.fx += force.x;	
				this.fy += force.y;
			}
		});	
	}

	updateMass()
	{
		if(this.entity.entities.length > 0)
		{
			this.mass = 0.0;
			this.entity.cog.x = 0;
			this.entity.cog.y = 0;

			this.entity.entities.forEach(dependent =>
			{
				if(dependent.hasComponent('PhysicsComponent'))
				{
					let dep = dependent.getComponent('PhysicsComponent');
					dep.updateMass();

					let cog = new Vector(dependent.cog.x,
										 dependent.cog.y);

					cog.relativeToAbsolute(this.entity.theta,
										   dependent.position.x,
										   dependent.position.y);

					this.entity.cog.x += cog.x * dep.mass;
					this.entity.cog.y += cog.y * dep.mass;
					this.mass += dep.mass;
				}
			});

			this.entity.cog.x /= this.mass;
			this.entity.cog.y /= this.mass;
		}
	}

	updateInertia()
	{
		if(this.entity.entities.length > 0)
		{
			this.inertia = 0.0;

			this.entity.entities.forEach(dependent =>
			{
				if(dependent.hasComponent('PhysicsComponent'))
				{
					let dep = dependent.getComponent('PhysicsComponent');

					dep.updateInertia();

					let d2 = (this.entity.cog.x - dependent.cog.x) 
						   * (this.entity.cog.x - dependent.cog.x)
					   	   + (this.entity.cog.y - dependent.cog.y) 
						   * (this.entity.cog.y - dependent.cog.y);

					this.inertia += dep.inertia + d2 * dep.mass;
				}
			});
		}
	}

	showFutureTrajectory(game, dt)
	{
		let entities = game.getEntitiesWithComponent('PhysicsComponent');

		let wells = entities.filter(entity => 
				entity.getComponent('PhysicsComponent').exertGravity);

		for(let i = 0; i<wells.length; i++)
			{
				let e1 = wells[i];
				let c1 = wells[i].getComponent('PhysicsComponent');
				for(let j = i+1; j<wells.length; j++)
				{
					let e2 = wells[j];
					let c2 = wells[j].getComponent('PhysicsComponent');

					let force = this.getGravity(c1.prediction.position, 
												c2.prediction.position,
												c1.mass,
												c2.mass);
	
					wells[i].getComponent('PhysicsComponent')
						.prediction.fx -= force.x;
					wells[i].getComponent('PhysicsComponent')
						.prediction.fy -= force.y;
					wells[j].getComponent('PhysicsComponent')
						.prediction.fx += force.x;
					wells[j].getComponent('PhysicsComponent')
						.prediction.fy += force.y;
				}
				let force = this.getGravity(c1.prediction.position, 
											this.prediction.position,
											c1.mass,
											this.mass);

				this.prediction.fx += force.x;
				this.prediction.fy += force.y;

				c1.prediction.update(dt, 
								   wells[i].position.x,
								   wells[i].position.y,
								   wells[i].vx,
								   wells[i].vy);			
			}
			this.prediction.update(dt, 
								   this.entity.position.x,
								   this.entity.position.y,
								   this.entity.vx,
				   				   this.entity.vy,
								   game.entities[1].position.x,
								   game.entities[1].position.y);

	
	}

}

class GravitySystem
{
	constructor(sun)
	{
		this.sun = sun;
	}

	update(dt, game)
	{
		
	}

	getForce(position)
	{
		return this.sun.getForce(position);
	}
}

class GravityNode
{
	constructor(mass, entity, sun)
	{
		this.mass0 = mass;
		this.mass = mass;
		this.cogx = entity.position.x;
		this.cogy = entity.position.y;
		this.vx = entity.vx;
		this.vy = entity.vy;
		this.entity = entity;
		this.dirty = false;
		this.conic;
		this.satellites = [];
		this.isRoot = false;

		if(sun == undefined)
		{
			this.SOI = 10000;
			this.isRoot = true;
		}
		else
		{
			this.setSOI(sun);
		}
	}

	update()
	{
		if(this.isRoot)
		{
			this.refreshMass();
			this.refreshTree();
		}
		this.satellites.forEach(satellite =>
		{
			satellite.conic.calculateOrbit(satellite, this);
		});
	}

	draw(context)
	{
		context.beginPath();
		context.arc(0, 0, this.SOI, 0, 2*Math.PI);
		context.stroke();

		this.satellites.forEach(satellite =>
		{
			satellite.conic.draw(context, this);
		});
	}

	setSOI(primary)
	{
		let R = this.entity.distance(primary.entity);
		this.SOI = R * Math.pow(this.mass/primary.mass, 2.5);
	}

	addSatellite(node)
	{
		let found = false;
		let i = 0;
		while(i < this.satellites.length && !found)
		{
			let satellite = this.satellites[i];
			if(node.isInsideSOI(satellite))
			{
				satellite.addSatellite(node);
				found = true;
			}
			i++;
		}
		if(!found)
		{
			this.satellites.push(node);
			node.conic = new Conic();
		}
	}

	refreshMass()
	{
		this.mass = this.mass0;	
		this.cogx = this.entity.position.x;
		this.cogy = this.entity.position.y;
		this.vx = this.entity.vx;
		this.vy = this.entity.vy;

		if(this.satellites.length == 0)
		{

		}
		else
		{
			this.cogx *= this.mass;
			this.cogy *= this.mass;
			this.vx *= this.mass;
			this.vy *= this.mass;


			this.satellites.forEach(satellite =>
			{
				satellite.refreshMass();

				this.mass += satellite.mass;
				this.cogx += satellite.cogx * satellite.mass;
				this.cogy += satellite.cogy * satellite.mass;
				this.vx += satellite.vx * satellite.mass;
				this.vy += satellite.vy * satellite.mass;
			});

			this.cogx = this.cogx/this.mass;
			this.cogy = this.cogy/this.mass;
			this.vx = this.vx/this.mass;
			this.vy = this.vy/this.mass;

			this.satellites.forEach(satellite =>
			{
				satellite.setSOI(this);
			});
		}
	}

	refreshTree()
	{
		let removed = [];

		if(this.satellites.length > 0)
		{
			this.satellites.forEach(satellite =>
			{
				let subRemoved = satellite.refreshTree();

				subRemoved.forEach(subSat =>
				{
					this.addSatellite(subSat);
				});
				
				if(subRemoved.length > 0)
					this.refreshMass();
			});

			removed = this.satellites.filter(
					satellite => !satellite.isInSOI(this));

			this.satellites = this.satellites.filter(
							satellite => satellite.isInSOI(this));
		}

		return removed;
	}

	isInSOI(primary)
	{
		let dx = primary.cogx - this.cogx;
		let dy = primary.cogy - this.cogy;
		return dx*dx + dy*dy < primary.SOI * primary.SOI;	
	}
}

/*
class GravityNode
{
	constructor(mass, entity, sun)
	{
		this.mass0 = mass;
		this.mass = mass;
		this.cogx = entity.position.x;
		this.cogy = entity.position.y;
		this.vx = entity.vx;
		this.vy = entity.vy;
		this.entity = entity;
		this.dirty = false;
		this.conics = new Array();
		this.maxNumber = 3;
		this.satellites = [];
		this.isRoot = false;

		if(sun == undefined)
		{
			this.SOI = 10000;
			this.isRoot = true;
		}
		else
		{
			this.setSOI(sun);
		}
	}

	update()
	{
		if(this.isRoot)
		{
			this.refreshMass();
			this.refreshTree();
		}
		this.satellites.forEach(satellite =>
		{
			satellite.conics[0].calculateOrbit(satellite, this);
		});
	}

	draw(context)
	{
		context.beginPath();
		context.arc(0, 0, this.SOI, 0, 2*Math.PI);
		context.stroke();

		this.satellites.forEach(satellite =>
		{
			satellite.conics[0].draw(context, this);
		});
	}

	setSOI(primary)
	{
		let R = this.entity.distance(primary.entity);
		this.SOI = R * Math.pow(this.mass/primary.mass, 2.5);
	}

	addSatellite(node)
	{
		let found = false;
		let i = 0;
		while(i < this.satellites.length && !found)
		{
			let satellite = this.satellites[i];
			if(node.isInsideSOI(satellite))
			{
				satellite.addSatellite(node);
				found = true;
			}
			i++;
		}
		if(!found)
		{
			this.satellites.push(node);
			node.conics.push(new Conic());
		}
	}

	refreshMass()
	{
		this.mass = this.mass0;	
		this.cogx = this.entity.position.x;
		this.cogy = this.entity.position.y;
		this.vx = this.entity.vx;
		this.vy = this.entity.vy;

		if(this.satellites.length == 0)
		{

		}
		else
		{
			this.cogx *= this.mass;
			this.cogy *= this.mass;
			this.vx *= this.mass;
			this.vy *= this.mass;


			this.satellites.forEach(satellite =>
			{
				satellite.refreshMass();

				this.mass += satellite.mass;
				this.cogx += satellite.cogx * satellite.mass;
				this.cogy += satellite.cogy * satellite.mass;
				this.vx += satellite.vx * satellite.mass;
				this.vy += satellite.vy * satellite.mass;
			});

			this.cogx = this.cogx/this.mass;
			this.cogy = this.cogy/this.mass;
			this.vx = this.vx/this.mass;
			this.vy = this.vy/this.mass;

			this.satellites.forEach(satellite =>
			{
				satellite.setSOI(this);
			});
		}
	}

	refreshTree()
	{
		let removed = [];

		if(this.satellites.length > 0)
		{
			this.satellites.forEach(satellite =>
			{
				let subRemoved = satellite.refreshTree();

				subRemoved.forEach(subSat =>
				{
					this.addSatellite(subSat);
				});
				
				if(subRemoved.length > 0)
					this.refreshMass();
			});

			removed = this.satellites.filter(
					satellite => !satellite.isInSOI(this));

			this.satellites = this.satellites.filter(
							satellite => satellite.isInSOI(this));
		}

		return removed;
	}

	isInSOI(primary)
	{
		let dx = primary.cogx - this.cogx;
		let dy = primary.cogy - this.cogy;
		return dx*dx + dy*dy < primary.SOI * primary.SOI;	
	}
}
*/
class Conic
{
	constructor()
	{
		this.entryPoint = new Vector(0, 0);
		this.exitPoint = new Vector(0, 0);
		this.beziers = [];
	}

	draw(context, primary)
	{
		if(this.e < 1)
		{
			context.translate(primary.cogx,
							  primary.cogy);

			context.rotate(this.theta);
			context.beginPath();
			context.ellipse(-this.c, 0, this.a, this.b, 0, 0, 2*Math.PI);
			context.stroke();	

			context.rotate(-this.theta);
			context.translate(-primary.cogx,
							  -primary.cogy);
		}
		else
		{
			context.translate(primary.cogx,
							  primary.cogy);


			drawPoint(context, this.exitPoint.x, this.exitPoint.y);

			context.rotate(this.theta);
			context.beginPath();

			for(let i = 0; i<this.beziers.length; i++)
			{
				let bez = this.beziers[i];
				context.moveTo(bez.start.x, bez.start.y);
				context.bezierCurveTo(bez.c1.x, bez.c1.y,
									  bez.c2.x, bez.c2.y,
									  bez.end.x, bez.end.y);
			}

			context.stroke();

			context.rotate(-this.theta);

			context.translate(-primary.cogx,
							  -primary.cogy);

		}
	}
		
	calculateOrbit(node, primary)
	{
		let x = node.cogx - primary.cogx;
		let y = node.cogy - primary.cogy;
		x /= 1000.0;
		y /= 1000.0;
		let vx = node.vx - primary.vx;
		let vy = node.vy - primary.vy;
		this.mu = primary.mass * 0.1;
		let r = Math.sqrt(x*x + y*y);
		let v = Math.sqrt(vx*vx + vy*vy);
		let dot_r_v = x*vx + y*vy;
		let h = x*vy - y*vx;
		let energy = v*v*0.5 -this.mu/r;
		let e_x = ((v*v - this.mu/r)*x - dot_r_v * vx)/this.mu;
		let e_y = ((v*v - this.mu/r)*y - dot_r_v * vy)/this.mu;
		this.e = Math.sqrt(e_x*e_x + e_y*e_y);
		this.a = -this.mu*0.5/energy * 1000;
		this.theta = Math.atan2(e_y, e_x);
		this.c = this.e * this.a;

		if(Math.abs(this.e) < 1)
		{
			this.b = this.a * Math.sqrt(1 - this.e*this.e);
			this.p = this.a * (1.0 - this.e*this.e);
		}
		else
		{
			this.b = Math.abs(this.a * Math.sqrt(this.e*this.e - 1));
			this.p = Math.abs(this.b*this.b / this.a);
			this.beta = Math.acos(-1.0/this.e);
			this.entryPoint = this.prepareDrawing(primary);
			this.entryPoint.y *= -Math.sign(h);
			this.exitPoint = new Vector(this.entryPoint.x,
								   	    -this.entryPoint.y);	

			this.entryPoint.rotate(this.theta);
			this.exitPoint.rotate(this.theta);
		}
	}

	prepareDrawing(primary)
	{
		let curve = [];
		let x, y, x2, y2;
		let a2 = this.a*this.a;
		let b2 = this.b*this.b;
		let cos_thetaExit = -(1.0 - this.p / primary.SOI)/this.e; 
		let sin_thetaExit = Math.sqrt(1 - cos_thetaExit*cos_thetaExit);
		let startPoint = new Vector(primary.SOI * cos_thetaExit,
									primary.SOI * sin_thetaExit);

		let cover = Math.min(Math.abs(startPoint.y), 5000);
		let step = cover * 0.25;

		curve.push(new Vector(startPoint.x, -startPoint.y));
		for(y = -cover; y <= cover; y+=step)
		{
			y2 = y*y;
			x = this.c-this.a*Math.sqrt(1 + y2/b2);
			curve.push(new Vector(-x, y));
		}
		curve.push(startPoint);
		this.beziers = CatmullRomToBezier(curve);

		return startPoint;
	}	
}

function CatmullRomToBezier(points)
{
	//from https://stackoverflow.com/questions/67391828/convert-hyperbola-to-b%C3%A9zier-curve-for-graphing-orbital-paths

	const beziers = [];
	
	for(let i=0; i<points.length-3; i++)
	{
		let [p1, p2, p3, p4] = points.slice(i);

		beziers.push({start : p2,
					  end: p3,
					  c1:{x:p2.x + (p3.x-p1.x)/6.0, y:p2.y+(p3.y-p1.y)/6.0},
					  c2:{x:p3.x - (p4.x-p2.x)/6.0, y:p3.y-(p4.y-p2.y)/6.0}
					  });
	}
	
	return beziers;
}

function getGravity(position1, position2, mass1, mass2)
	{
		let G = 0.0001;
		let dx = (position1.x-position2.x)/1000.0;
		let dy = (position1.y-position2.y)/1000.0;
		let d = Math.sqrt(dx*dx + dy*dy);
		d = Math.max(d, 0.000001);

		return new Vector(G*mass1*mass2*dx/(d*d*d),
						  G*mass1*mass2*dy/(d*d*d));
}

function drawPoint(context, x, y)
{
	context.beginPath();
	context.arc(x, y, 15, 0, 2*Math.PI);
	context.stroke();
}

