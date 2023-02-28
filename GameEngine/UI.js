class Mouse
{
	constructor()
	{
		this.x = 0;
		this.y = 0;
		this.vx = 0;
		this.vy = 0;
		this.state = 0;
		this.lastEvent = new Date();
		this.collider = new PointCollider(this);
	}

	update(x, y)
	{
		let dt = new Date() - this.lastEvent;
		this.lastEvent = new Date();

		this.vx = (x - this.x)/dt;
		this.vy = (y - this.y)/dt;
		this.x = x;
		this.y = y;
	}
}


class UI
{
	constructor(width, height, element)
	{
		this.width = width;
		this.height = height;
		this.debug = true;
		this.mouse = new Mouse();
		this.element = element;
		this.components = [];	

		let that = this;
		element.onmousemove = function(event){that.onMouseMove(event);};
		element.onmousedown = function(){that.onMouseDown(event);};
		element.onmouseup = function(){that.onMouseUp(event);};
		this.visible = true;
	}

	draw(context)
	{
		if(!this.visible)return;
		this.components.forEach(component => {component.draw(context);});
	}

	addComponent(component)
	{
		this.components.push(component);
		console.log("component added");
	}

	onMouseMove(event)
	{
		let bb = event.target.getBoundingClientRect();

		let x = (event.clientX - bb.left)*this.width
										/(bb.right-bb.left);
		let y = (event.clientY - bb.top)*this.height
										/(bb.bottom-bb.top);
		this.mouse.update(x, y);	

		this.components.forEach(component => 
		{
			component.onMouseMove(this.mouse);
		});
	}

	onMouseDown(e)
	{
		for(let i = 0; i<this.components.length; i++)
		{
			if(this.components[i].onMouseDown(this.mouse, e)) return true;
		}
		return false;
	}

	onMouseUp(e)
	{
		for(let i = 0; i<this.components.length; i++)
		{
			if(this.components[i].onMouseUp(this.mouse, e));
		}
		return false;
	}
}


class Interactable
{
	constructor(collider)
	{
		this.collider = collider;
	}

	isMouseOver(mouseCollider)
	{
		return this.collider.intersect(mouseCollider);
	}

	draw(context)
	{
		this.collider.draw(context);
	}

	onMouseMove(mouse, e)
	{
		return false;
	}

	onMouseDown(mouse, e)
	{
		return false;
	}

	onMouseUp(mouse, e)
	{
		return false;
	}
}

class Draggable extends Interactable
{
	constructor(position, r)
	{
		super(new SphereCollider(position, r));
		this.held = false;
		this.position = position;
		this.listeners = [];
	}

	onMouseMove(mouse, e)
	{
		if(this.held)
		{
			this.position.x = mouse.x;
			this.position.y = mouse.y;
			this.collider.position.x = mouse.x;
			this.collider.position.y = mouse.y;

			this.listeners.forEach(listener => 
								   listener.onMouseMove(mouse,e));

			return true;
		}
		return false;
	}

	onMouseDown(mouse, e)
	{
		if(this.isMouseOver(mouse.collider))
		{
			this.listeners.forEach(listener => 
								   listener.onMouseDown(mouse,e));

			this.held = true;
			return true;
		}
		return false;
	}

	onMouseUp(mouse, e)
	{
		if(this.held)
		{
			this.listeners.forEach(listener => 
								   listener.onMouseUp(mouse,e));


			this.held = false;
		}
		return false;
	}

}

class ArrowInteractable extends Interactable
{
	constructor(start, end, width)
	{
		super(null);
		this.point0 = new Draggable(start, 25);
		this.point1 = new Draggable(end, 35);
		this.width = width;
		this.setParameters();
	}

	draw(context)
	{
		let x0 = this.point0.position.x;
		let y0 = this.point0.position.y;
			
		context.translate(x0, y0);
		context.rotate(this.theta);
		context.beginPath();
	
		context.moveTo(0, this.width*0.5);
		context.lineTo(this.l*0.7, this.width*0.5);
		context.lineTo(this.l*0.65, this.l*0.05 + this.width*0.5);
		context.lineTo(this.l, 0);
		context.lineTo(this.l*0.65, -this.l*0.05 - this.width*0.5);
		context.lineTo(this.l*0.7, -this.width*0.5);
		context.lineTo(0, -this.width*0.5);
		context.lineTo(0, this.width*0.5);

		context.stroke();	
		context.rotate(-this.theta);
		context.translate(-x0, -y0);

		this.point0.draw(context);
		this.point1.draw(context);
	}

	onMouseMove(mouse, e)
	{
		if(this.point0.onMouseMove(mouse))
		{
			this.point1.position.x = this.point0.position.x +
									 this.l*Math.cos(this.theta);
			this.point1.position.y = this.point0.position.y +
									 this.l*Math.sin(this.theta);

		}
		else if(this.point1.onMouseMove(mouse))
		{
			this.setParameters();
		}

		return false;
	}

	onMouseDown(mouse, e)
	{
		if(this.point0.onMouseDown(mouse))return true;	
		if(this.point1.onMouseDown(mouse))return true;	
		return false;
	}

	onMouseUp(mouse, e)
	{
		this.point0.onMouseUp(mouse);	
		this.point1.onMouseUp(mouse);
		return false;	
	}

	setParameters()
	{
		let x0 = this.point0.position.x;
		let y0 = this.point0.position.y;
		let x1 = this.point1.position.x;
		let y1 = this.point1.position.y;

		this.theta = Math.atan2(y1-y0, x1-x0);
		this.l = Math.sqrt((x1-x0)*(x1-x0)+(y1-y0)*(y1-y0));
	}

	length()
	{
		return this.l;
	}

	getDx()
	{
		return this.point1.position.x - this.point0.position.x;
	}

	getDy()
	{
		return this.point1.position.y - this.point0.position.y;
	}
}

class RectangleInteractable extends Interactable
{
	constructor(center, width, height, theta)
	{
		super(null);
		this.point0 = new Draggable(center,25);

		let p0 = new Vector(center.x+width*0.5, center.y);
		p0.rotate(theta)
		let p1 = new Vector(center.x, center.y+height*0.5);
		p1.rotate(theta)

		this.point1 = new Draggable(p0,35);
		this.point2 = new Draggable(p1,35);

		this.width = width*0.5;
		this.height = height*0.5;
		this.theta = theta;
	}

	draw(context)
	{
		let x0 = this.point0.position.x;
		let y0 = this.point0.position.y;

		context.translate(x0, y0);
		context.rotate(this.theta);

		context.beginPath();
		context.moveTo(-this.width, -this.height);
		context.lineTo(-this.width, this.height);
		context.lineTo(this.width, this.height);
		context.lineTo(this.width,-this.height);
		context.lineTo(-this.width, -this.height);
		context.stroke();

		context.rotate(-this.theta);
		context.translate(-x0, -y0);

		this.point0.draw(context);
		this.point1.draw(context);
		this.point2.draw(context);
	}

	onMouseMove(mouse, e)
	{
		if(this.point0.onMouseMove(mouse))
		{
			this.point1.position.x = this.point0.position.x +
									 this.width*Math.cos(this.theta);
			this.point1.position.y = this.point0.position.y +
									 this.width*Math.sin(this.theta);
			this.point2.position.x = this.point0.position.x -
									 this.height*Math.sin(this.theta);
			this.point2.position.y = this.point0.position.y +
									 this.height*Math.cos(this.theta);
		}
		else if(this.point1.onMouseMove(mouse))
		{
			let x0 = this.point0.position.x;
			let y0 = this.point0.position.y;
			let x1 = this.point1.position.x;
			let y1 = this.point1.position.y;

			this.theta = Math.atan2(y1-y0, x1-x0);

			this.width = this.getWidth();

			this.point2.position.x = this.point0.position.x -
									 this.height*Math.sin(this.theta);
			this.point2.position.y = this.point0.position.y +
									 this.height*Math.cos(this.theta);
		
		}
		else if(this.point2.onMouseMove(mouse))
		{
			this.height = this.getHeight();
			this.point2.position.x = this.point0.position.x -
									 this.height*Math.sin(this.theta);
			this.point2.position.y = this.point0.position.y +
									 this.height*Math.cos(this.theta);
		}

		return false;
	}

	onMouseDown(mouse, e)
	{
		if(this.point0.onMouseDown(mouse))return true;	
		if(this.point1.onMouseDown(mouse))return true;	
		if(this.point2.onMouseDown(mouse))return true;	
		return false;
	}

	onMouseUp(mouse, e)
	{
		this.point0.onMouseUp(mouse);	
		this.point1.onMouseUp(mouse);
		this.point2.onMouseUp(mouse);
		return false;	
	}

	getWidth()
	{
		let p01 = this.point1.position.subtract(this.point0.position);
		return p01.length();
	}

	getHeight()
	{
		let p02 = this.point2.position.subtract(this.point0.position);
		return p02.length();
	}
}

class BezierInteractable extends Interactable
{
	constructor()
	{
		super(null);
		this.nodes = [];
		this.editing = true;
		this.wasChanged = false;
	}

	addPoint(position)
	{
		if(this.nodes.length > 0)
			this.nodes.push(new Draggable(position.add(
			 this.nodes[this.nodes.length-1].position).multiply(0.5), 20));	
		this.nodes.push(new Draggable(position, 25));	
	}

	draw(context)
	{
		if(this.nodes.length > 1)
		{
			context.beginPath();

			for(let i = 0; i<this.nodes.length-2; i+=2)
			{
				let x0 = this.nodes[i].position.x;
				let y0 = this.nodes[i].position.y;
				let xc = this.nodes[i+1].position.x;
				let yc = this.nodes[i+1].position.y;
				let x1 = this.nodes[i+2].position.x;
				let y1 = this.nodes[i+2].position.y;

				context.moveTo(x0, y0);
				context.quadraticCurveTo(xc, yc, x1, y1);	
				context.stroke();
			}
		}
		this.nodes.forEach(node => node.draw(context));
	}

	onMouseMove(mouse, e)
	{
		this.nodes.forEach(node => 
		{
			if(node.onMouseMove(mouse)) this.wasChanged = true;
		});
		return false;
	}

	onMouseDown(mouse, e)
	{
		for(let i = 0; i<this.nodes.length; i++)
		{
			if(this.nodes[i].onMouseDown(mouse))return true;
		}
		return false
	}

	onMouseUp(mouse, e)
	{
		if(e.button == 2)
		{
			this.editing = false;
		}
		else if(e.button == 0 && this.editing == true)
		{
			this.addPoint(new Vector(mouse.x, mouse.y));	
		}

		this.nodes.forEach(node => node.onMouseUp(mouse));

		return false;	
	}

	getSplitCurve(h, spacingRatio)
	{
		let result = [];
		for(let i = 0; i<this.nodes.length-2; i+=2)
		{
			let l = this.getBezierLength(i, 5);
			let nb = Math.round(l/(spacingRatio*h))+1;
			let dt = 1.0/(nb-1);
			let t = dt;
			for(let j = 0; j<nb-1; j++)
			{
				let pos = this.getPosition(this.nodes[i].position,
								 		   this.nodes[i+1].position,
									  	   this.nodes[i+2].position,
										   t);

				result.push(new Vector(pos.x, pos.y));

				t += dt;
			}
		}

		return result;
	}

	getBezierLength(nodeIndex, nbSegments)
	{
		let p0 = this.nodes[nodeIndex].position;
		let p1 = this.nodes[nodeIndex+1].position;
		let p2 = this.nodes[nodeIndex+2].position;

		let t = 0;
		let dt = 1.0/(nbSegments-1);
		let d = 0;

		let a = p0;
		for(let i = 0; i<nbSegments-1; i++)
		{
			t += dt;
			let b = this.getPosition(p0, p1, p2, t);
			d += b.distance(a);
			a = b;	
		}

		let b = p2;
		d += b.distance(a);

		return d;
	}

	getPosition(p0, c, p1, t)
	{
		return ((p0.multiply((1-t)*(1-t))).add(c.multiply(2*t*(1-t))))
				.add(p1.multiply(t*t));
	}
}


class CircleInteractable extends Interactable
{
	constructor(center, radius)
	{
		super(new SphereCollider(center, radius));
		this.point0 = new Draggable(center, 25);
		this.point1 = new Draggable(center.add(new Vector(radius,0)), 35);
		this.setParameters();
	}

	draw(context)
	{
		context.beginPath();
		context.arc(this.point0.position.x, 
					this.point0.position.y,
					this.radius, 0, 2*Math.PI);
		context.stroke();

		this.point0.draw(context);
		this.point1.draw(context);
	}

	onMouseMove(mouse, e)
	{
		if(this.point0.onMouseMove(mouse))
		{
			this.point1.position.x = this.point0.position.x +
									 this.radius;
			this.point1.position.y = this.point0.position.y;
		}
		else if(this.point1.onMouseMove(mouse))
		{
			this.setParameters();
			this.collider.r = this.radius;
		}

		return false;
	}

	onMouseDown(mouse, e)
	{
		this.point0.onMouseDown(mouse, e);	
		this.point1.onMouseDown(mouse, e);	
	}

	onMouseUp(mouse, e)
	{
		this.point0.onMouseUp(mouse);
		this.point1.onMouseUp(mouse);
		return false;
	}

	setParameters()
	{
		this.radius = this.point0.position.distance(this.point1.position);
	}
}
