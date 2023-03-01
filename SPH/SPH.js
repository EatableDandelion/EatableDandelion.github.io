class Particle
{
	constructor(x, y, h, m, vx, vy, color, isGhost)
	{
		this.x = x;
		this.y = y;
		this.h = h;
		this.m = h*h/4000*m;
		this.rho = 0;
		this.P = 0;
		this.vx = vx;
		this.vy = vy;
		this.fx = 0;
		this.fy = 0;
		this.id = 0;
		this.markedForDeletion = false;
		this.color = color;
		this.fx_old = 0;
		this.fy_old = 0;
		this.isGhost = isGhost;
		this.offsetX = 0; //only used for rigid bodies
		this.offsetY = 0; //only used for rigid bodies
	}

	draw(context)
	{
		context.beginPath();
		context.fillStyle = this.color;
		context.arc(this.x, this.y, this.h*0.8, 0, 2*Math.PI);
		context.fill();
		context.fillStyle = "black";
	}
}

class RigidBody
{
	constructor()
	{
		this.x = 0;
		this.y = 0;
		this.I = 0;
		this.theta = 0;
		this.m = 0;
		this.vx = 0;
		this.vy = 0;
		this.vz = 0;
		this.fx = 0;
		this.fy = 0;
		this.fz = 0;

	}

	init()
	{
		this.particles.forEach(particle =>
		{
			this.x += particle.x * particle.m;
			this.y += particle.y * particle.m;
			this.m += particle.m;
			this.vx += particle.vx * particle.m;
			this.vy += particle.vy * particle.m;
		});

		this.x /= this.m;
		this.y /= this.m;
		this.vx /= this.m;
		this.vy /= this.m;
	
		this.particles.forEach(particle =>
		{
			this.I += (this.x-particle.x)*(this.x-particle.x)*particle.m;
			this.I += (this.y-particle.y)*(this.y-particle.y)*particle.m;

			particle.offsetX = particle.x - this.x;
			particle.offsetY = particle.y - this.y;
		});

		this.m *= 1000;
		this.I *= 1000;	
	}

	update(dt)
	{
		this.particles.forEach(particle =>
		{
			let rotatedx = particle.offsetX*Math.cos(this.theta)
						 + particle.offsetY*Math.sin(this.theta);
			let rotatedy =-particle.offsetX*Math.sin(this.theta)
						 + particle.offsetY*Math.cos(this.theta);


			this.fx += particle.fx;
			this.fy += particle.fy;

			this.fz += particle.fx * rotatedy;
			this.fz -= particle.fy * rotatedx;

			particle.fx = 0;
			particle.fy = 0;
			particle.fz = 0;
		});
		this.vx += dt*this.fx/this.m;
		this.vy += dt*this.fy/this.m;
		this.vz += dt*this.fz/this.I;

		this.x += dt*this.vx;
		this.y += dt*this.vy;
		this.theta += dt*this.vz;

		this.fx = 0;
		this.fy = 0;
		this.fz = 0;

		this.particles.forEach(particle =>
		{
			particle.x = this.x + particle.offsetX*Math.cos(this.theta)
								+ particle.offsetY*Math.sin(this.theta);
			particle.y = this.y - particle.offsetX*Math.sin(this.theta)
								+ particle.offsetY*Math.cos(this.theta);
		});	
		
	}

	setParticles(particles)
	{
		this.particles = particles;
		this.x = 0;
		this.y = 0;
		this.I = 0;
		this.theta = 0;
		this.m = 0;
		this.vx = 0;
		this.vy = 0;
		this.vz = 0;
		this.fx = 0;
		this.fy = 0;
		this.fz = 0;
		this.init();
	}
}

class ParticleSystem
{
	constructor(width, height)
	{
		this.particles = [];
		this.rigidBodies = [];
		this.width = width;
		this.height = height;
		this.gravityToggle = 0;
		this.selfGravityToggle = 0;
		this.viscosityToggle = 1;
		this.cs = 0.2; //speed of sound
		this.g = 0;
		this.selfG = 1.2;
		this.nbParticles = 0;
		this.nu = 0.0;
		this.bcs = [];
		this.bcIds = 0;
		this.alpha = 10;
		this.beta = 2*this.alpha;
		this.mu = 1;
		this.grid = new Grid(30, 18, 0, 0, width, height);
		this.particleVisible = false;
		this.resultDisplay = "";
	}

	update(dt)
	{
		this.particles = 
			this.particles.filter(particle => !particle.markedForDeletion);

		this.bcs = 
			this.bcs.filter(bc => !bc.markedForDeletion);

		this.bcs.forEach(bc =>
		{
			bc.update(this, dt);
		});


		this.grid.clearGrid();
		this.particles.forEach(particle => this.grid.add(particle));

		this.setDensity();

		let n = this.particles.length;
		for(let i = 0; i<n; i++)
		{
			let pi = this.particles[i];
			let neighbors = this.grid.getNeighbors(pi);

			for(let j = 0; j<neighbors.length; j++)
			{
				let pj = neighbors[j];
				if(pj.id <= pi.id) continue;

				let dx = pi.x - pj.x;
				let dy = pi.y - pj.y;
				let r = Math.sqrt(dx*dx + dy*dy);
				dx /= r;
				dy /= r;

				let dW = this.dW(r,(pi.h+pj.h)*0.5);

				let stress = this.getPressureTerm(pi, pj)
						   + this.getArtificialViscosity(pi, pj, r, dx, dy);

				if(this.viscosityToggle == 1)
					stress += this.getViscosity(pi, pj, r, dx, dy);

				stress *= dW;

				pi.fx += -pj.m * stress * dx;
				pi.fy += -pj.m * stress * dy;
				pj.fx -= -pi.m * stress * dx;
				pj.fy -= -pi.m * stress * dy;

				pi.fy += this.g * this.gravityToggle;
				pj.fy += this.g * this.gravityToggle;

			}
		}

		if(this.selfGravityToggle == 1)
		{
			for(let i = 0; i<n; i++)
			{
				let pi = this.particles[i];
	
				for(let j = i+1; j<this.particles.length; j++)
				{
					let pj = this.particles[j];

					let dx = pi.x - pj.x;
					let dy = pi.y - pj.y;
					let r = Math.sqrt(dx*dx + dy*dy);
					dx /= r;
					dy /= r;

					pi.fx += -pj.m * this.selfG / (r*r) * dx;
					pi.fy += -pj.m * this.selfG / (r*r) * dy;
					pj.fx -= -pi.m * this.selfG / (r*r) * dx;
					pj.fy -= -pi.m * this.selfG / (r*r) * dy;
				}
			}
		}


		this.particles.filter(particle => particle.isGhost)
					  .forEach(particle => 
		{
			this.enforceGhostBCs(particle, dt);
		});

		let E = 0;
		this.particles.filter(particle => !particle.isGhost)
					  .forEach(particle => 
		{
			particle.vx += dt*(particle.fx+particle.fx_old)*0.5;
			particle.vy += dt*(particle.fy+particle.fy_old)*0.5;

			particle.vx = Math.min(Math.max(-2, particle.vx),2);
			particle.vy = Math.min(Math.max(-2, particle.vy),2);

			particle.x += dt*particle.vx + 0.5*particle.fx*dt*dt;
			particle.y += dt*particle.vy + 0.5*particle.fy*dt*dt;

			particle.fx_old = particle.fx;	
			particle.fy_old = particle.fy;	

			particle.fx = 0;
			particle.fy = 0;


			E += 0.5*(particle.vx*particle.vx+particle.vy*particle.vy);

			this.enforceBCs(particle, dt);		


		});


		this.rigidBodies.forEach(body => body.update(dt));


		//console.log(E);
	}


	setDensity()
	{
		let n = this.particles.length;
		for(let i = 0; i<n; i++)
		{
			let pi = this.particles[i];
			pi.rho = pi.m * this.W(0, pi.h);

			let neighbors = this.grid.getNeighbors(pi);

			for(let j = 0; j<neighbors.length; j++)
			{
				let pj = neighbors[j];
				if(pj.id <= pi.id) continue;

				let dx = pi.x - pj.x;
				let dy = pi.y - pj.y;
				let r = Math.sqrt(dx*dx + dy*dy);
				dx /= r;
				dy /= r;
				let rho_ij = pj.m * this.W(r, (pi.h+pj.h)*0.5);
				pi.rho += rho_ij;
				pj.rho += rho_ij;			
			}
			pi.P = (this.cs)*(this.cs)*(pi.rho);
		}
	}

	getPressureTerm(p1, p2)
	{
		return (p1.P+p2.P)/(p1.rho*p2.rho);
	}

	getArtificialViscosity(p1, p2, r, dx, dy)
	{
		let v_dot_r = (p1.vx-p2.vx) * dx + (p1.vy-p2.vy) * dy;
		if(v_dot_r > 0) return 0;

		let epsilon = 0.01;
		let h = (p1.h + p2.h)*0.5;
		let mu = h * v_dot_r;
		mu /= r*r + epsilon*h*h;
		let cs = (p1.P+p2.P)/(p1.rho+p2.rho);

		return (-this.alpha*cs*mu + this.beta*mu*mu)*2.0/(p1.rho+p2.rho);
	}

	getViscosity(p1, p2, r, dx, dy)
	{
		let v_dot_r = (p1.vx-p2.vx) * dx + (p1.vy-p2.vy) * dy;

		let d = 2; //number of dimensions;

		let epsilon = 0.01;
		let h = (p1.h + p2.h)*0.5;

		return -2*(d+2)*this.mu*v_dot_r/(p2.rho*(r*r+0.01*h*h));
	}


	W(r, h)
	{
		let x = r/h;
		if(x < 1)
		{
			return (1.0 - 3.0*0.5*x*x + 3.0*0.25*x*x*x)/(Math.PI * h*h*h); 
		}
		else if(x < 2)
		{
			return 0.25*(2.0-x)*(2.0-x)*(2.0-x)/(Math.PI * h*h*h); 
		}
		return 0.0;
	}

	dW(r, h)
	{
		let x = r/h;
		if(x < 1)
		{
			return (9.0*0.25*x*x - 3.0*x)/(Math.PI * h*h*h*h); 
		}
		else if(x < 2)
		{
			return (-3.0*0.25*(2.0-x)*(2.0-x))/(Math.PI * h*h*h*h); 
		}
		return 0.0;
	}

	enforceGhostBCs(particle, dt)
	{
		let restitution = 1.0;
		
		if(particle.x > this.width - particle.h)
		{
			particle.fx_old = 0;
			particle.fx = Math.min(0,-2*particle.vx*restitution/dt);
		}
		else if(particle.x < particle.h)
		{
			particle.fx_old = 0;
			particle.fx = Math.max(0,-2*particle.vx*restitution/dt);
		}
		if(particle.y > this.height - particle.h)
		{
			particle.fy_old = 0;
			particle.fy = Math.min(0,-2*particle.vy*restitution/dt);
		}
		else if(particle.y < particle.h)
		{
			particle.fy_old = 0;
			particle.fy = Math.max(0,-2*particle.vy*restitution/dt);
		}
	}


	enforceBCs(particle, dt)
	{
		let restitution = 1.0;
		
		if(particle.x > this.width - particle.h)
		{
			particle.vx *= -restitution;
			particle.x = 2*(this.width - particle.h) - particle.x;
		}
		else if(particle.x < particle.h)
		{
			particle.vx *= -restitution;
			particle.x = -particle.x + 2*particle.h;
		}
		if(particle.y > this.height - particle.h)
		{
			particle.vy *= -restitution;
			particle.y = 2*(this.height - particle.h) - particle.y;
		}
		else if(particle.y < particle.h)
		{
			particle.vy *= -restitution;
			particle.y = -particle.y + 2*particle.h;
		}
	}

	addParticle(x, y, r, m, vx, vy, color, isGhost)
	{
		let particle = new Particle(x, y, r, m, vx, vy, color, isGhost);
		particle.id = this.nbParticles++;
		this.particles.push(particle);
		return particle;
	}

	draw(context, paused)
	{
		if(this.resultDisplay != "")
			this.grid.draw(context, this.resultDisplay);

		if(this.particleVisible)
		{
			this.particles.forEach(particle =>
			{
				particle.draw(context);
			});
		}
	
	}
	
	addBC(bc)
	{
		bc.id = this.bcIds++;
		this.bcs.push(bc);
	}

	getBC(id)
	{
		return this.bcs.filter(bc => bc.id == id)[0];
	}

	reset()
	{
		this.grid.reset();

		this.particles = this.particles
							 .filter(particle => particle.isGhost);

		this.bcs.forEach(bc =>
		{
			bc.reset();
		});
	}

	getNumberOfParticles()
	{
		return this.particles.length;
	}

	setGravity(g)
	{
		this.g = g*0.00002;
	}

	setSelfGravity(g)
	{
		this.selfG = g;
	}

	setViscosity(mu)
	{
		this.mu = mu;
	}

	setSpeedOfSound(cs)
	{
		this.cs = cs;
	}
}


class BC
{
	constructor()
	{
		this.id = 0;
		this.markedForDeletion = false;
	}

	update(particleSystem, dt)
	{}

	reset()
	{}

	remove()
	{}
}


class Inflow extends BC
{
	constructor(h, x0,y0, x1,y1, UI, color)
	{
		super();

		this.pColor = color;
		this.center = new Vector((x0+x1)*0.5, (y0+y1)*0.5);
		this.width = Math.sqrt((x0-x1)*(x0-x1)+(y0-y1)*(y0-y1));

		this.arrow = new ArrowInteractable(this.center,
						  	this.center.add(new Vector(200,0)), 20);

		this.rect = new RectangleInteractable(this.center,
											  this.width,
				 							  100, 
											  Math.PI/2);
	
		UI.addComponent(this.rect);		
		UI.addComponent(this.arrow);	

		this.rect.point0.listeners.push(this.arrow.point0);
		this.h = h;
	}

	update(particles, dt)
	{
		let n = this.rect.height*2*dt/1000.0;
		if(n < 1)
		{
			if(Math.random() < n) n = 1;
		}
	
		let u = this.arrow.getDx()/300;
		let v = this.arrow.getDy()/300;

		for(let i = 0; i<Math.round(n); i++)
		{
			let l = 2 * (Math.random() - 0.5) * this.rect.width;
			let x = this.center.x + l*Math.cos(this.rect.theta);
			let y = this.center.y + l*Math.sin(this.rect.theta);

			particles.addParticle(x, y,this.h, 1, u, v, this.pColor, false);	
		}
	}

	remove()
	{
		this.rect.remove();	
		this.arrow.remove();	
	}	
}

class Outflow extends BC
{
	constructor(x0,y0, x1,y1, UI)
	{
		super();

		let center = new Vector((x0+x1)*0.5, (y0+y1)*0.5);
		let width = Math.sqrt((x0-x1)*(x0-x1)+(y0-y1)*(y0-y1));

		this.collider = new SegmentCollider(new Vector(x0,y0), 
											new Vector(x1,y1));
		this.partCollider = new SegmentCollider(new Vector(0,0), 
												new Vector(0,0));

		this.rect = new RectangleInteractable(center,
											  width,
				 							  10, 
											  Math.PI/2);
	
		UI.addComponent(this.rect);		
	}

	update(particles, dt)
	{
		this.collider.p0.x = this.rect.point0.position.x 
						   + this.rect.width*Math.cos(this.rect.theta);
		this.collider.p0.y = this.rect.point0.position.y 
						   + this.rect.width*Math.sin(this.rect.theta);
		this.collider.p1.x = this.rect.point0.position.x 
						   - this.rect.width*Math.cos(this.rect.theta);
		this.collider.p1.y = this.rect.point0.position.y 
						   - this.rect.width*Math.sin(this.rect.theta);


		particles.particles.forEach(particle =>
		{
			this.partCollider.p0.x = particle.x;
			this.partCollider.p0.y = particle.y;
			this.partCollider.p1.x = particle.x + particle.vx * dt;
			this.partCollider.p1.y = particle.y + particle.vy * dt;
			if(this.collider.intersect(this.partCollider))
			{
				particle.markedForDeletion = true;
			}

		});
	}
	
	remove()
	{
		this.rect.remove();	
	}
}




class BodyForce extends BC
{
	constructor(f0, x0,y0, x1,y1, UI)
	{
		super();

		let center = new Vector((x0+x1)*0.5, (y0+y1)*0.5);
		let width = Math.sqrt((x0-x1)*(x0-x1)+(y0-y1)*(y0-y1));

		this.collider = new SegmentCollider(new Vector(x0,y0), 
											new Vector(x1,y1));
		this.partCollider = new SegmentCollider(new Vector(0,0), 
												new Vector(0,0));

		this.rect = new RectangleInteractable(center,
											  width,
				 							  10, 
											  Math.PI/2);
	
		this.arrow = new ArrowInteractable(center,
						  			center.add(new Vector(f0*10000,0)), 20);


		UI.addComponent(this.rect);		
		UI.addComponent(this.arrow);		
		this.rect.point0.listeners.push(this.arrow.point0);
	}

	update(particles, dt)
	{
		this.collider.p0.x = this.rect.point0.position.x 
						   + this.rect.width*Math.cos(this.rect.theta);
		this.collider.p0.y = this.rect.point0.position.y 
						   + this.rect.width*Math.sin(this.rect.theta);
		this.collider.p1.x = this.rect.point0.position.x 
						   - this.rect.width*Math.cos(this.rect.theta);
		this.collider.p1.y = this.rect.point0.position.y 
						   - this.rect.width*Math.sin(this.rect.theta);

		let dx = this.arrow.getDx();
		let dy = this.arrow.getDy();

		particles.particles.forEach(particle =>
		{
			this.partCollider.p0.x = particle.x;
			this.partCollider.p0.y = particle.y;
			this.partCollider.p1.x = particle.x + particle.vx * dt;
			this.partCollider.p1.y = particle.y + particle.vy * dt;

			if(this.collider.intersect(this.partCollider))
			{
				particle.fx += dx*0.001;
				particle.fy += dy*0.001;
			}
		});
	}

	remove()
	{
		this.rect.remove();	
		this.arrow.remove();	
	}
}

class RectangleSpawn extends BC
{
	constructor(h, x0,y0, color, UI)
	{
		super();

		let width = 200;
		this.spent = false;
		this.h = h;
		this.color = color;

		this.center = new Vector(x0, y0);

		this.rect = new RectangleInteractable(this.center,
											  width, width, 0);

		this.arrow = new ArrowInteractable(this.center,
						  	this.center.add(new Vector(200,0)), 20);

		UI.addComponent(this.rect);		
		UI.addComponent(this.arrow);		
		this.rect.point0.listeners.push(this.arrow.point0);
	}

	update(particles, dt)
	{
		if(this.spent) return;
		this.spent = true;

		let x0 = this.rect.point0.position.x;		
		let y0 = this.rect.point0.position.y;
		let theta = -this.rect.theta;
		let width = 2*this.rect.width;	
		let height = 2*this.rect.height;
		let m = Math.round(width/(2.5*this.h))+1;
		let n = Math.round(height/(2*this.h))+1;
		let dx = this.arrow.getDx();
		let dy = this.arrow.getDy();

		for(let i = 0; i<m; i++)
		{
			for(let j = 0; j<n; j++)
			{
				let x = (i+(j%2)/2-m/2)*width/m;
				let y = (j-n/2)*height/n;

				particles.addParticle(
							x0+x*Math.cos(theta)+y*Math.sin(theta),
							y0-x*Math.sin(theta)+y*Math.cos(theta),
							this.h, 1, dx*0.001, dy*0.001, this.color,
							false); 
			}
		}
	}

	reset()
	{
		this.spent = false;
	}	
	
	remove()
	{
		this.rect.remove();	
		this.arrow.remove();	
	}
}

class Wall extends BC
{
	constructor(h, UI)
	{
		super();

		this.line = new BezierInteractable();
		UI.addComponent(this.line);
		this.h = h;
		this.particles = [];
		this.first = true;
	}

	update(particles, dt)
	{
		if(this.line.wasChanged || this.first)
		{
			this.first = false;
			this.particles.forEach(p => 
			{
				p.markedForDeletion = true;
			});

			this.line.getSplitCurve(this.h, 0.8).forEach(position =>
			{
				this.particles.push(
						particles.addParticle(position.x, 
											  position.y, 
											  this.h, 1, 0, 0, "grey",
											  true));
			});

			this.line.wasChanged = false;
		}		
	}	

	remove()
	{
		this.line.remove();	
	}
}

class RigidBodySpawn extends BC
{
	constructor(h, UI, particleSystem)
	{
		super();

		this.line = new BezierInteractable();
		UI.addComponent(this.line);
		this.spent = false;
		this.h = h;
		this.particles = [];
		this.body = new RigidBody();
		particleSystem.rigidBodies.push(this.body);
	}

	update(particles, dt)
	{
		if(!this.spent)
		{
			this.spent = true;

			this.line.getSplitCurve(this.h, 0.8).forEach(position =>
			{
				this.particles.push(
						particles.addParticle(position.x, 
											  position.y, 
											  this.h, 1, 0, 0, "grey",
											  true));
			});

			this.line.wasChanged = false;
			this.body.setParticles(this.particles)
		}		
	}

	reset()
	{
		this.particles.forEach(p => 
		{
			p.markedForDeletion = true;
		});

		this.spent = false;
	}

	remove()
	{
		this.line.remove();	
	}
}

function drawPoint(context, x, y, r)
{
	context.beginPath();
	context.arc(x, y, r, 0, 2*Math.PI);
	context.fill();
}


