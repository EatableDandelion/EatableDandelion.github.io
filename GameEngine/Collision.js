class Contact
{
	constructor(x, y, nx, ny)
	{
		this.x = x;
		this.y = y;
		this.nx = nx;
		this.ny = ny;
	}
}


class Collider
{
	constructor(id)
	{
		this.id = id;
	}

	intersect(geometry, contacts)
	{
		if(geometry.id == "segment")
			return this.intersectSegment(geometry, contacts);
		else if(geometry.id == "point")
			return this.intersectPoint(geometry, contacts);
		else if(geometry.id == "sphere")
			return this.intersectSphere(geometry, contacts);
		else if(geometry.id == "OBB")
			return this.intersectOBB(geometry, contacts);
			
		return false;
	}

	intersectSegment(geometry, contacts)
	{}

	intersectPoint(geometry, contacts)
	{}

	intersectSphere(geometry, contacts)
	{}

	intersectOBB(geometry, contacts)
	{}
}

class SegmentCollider extends Collider
{
	constructor(p0, p1)
	{
		super("segment");
		this.p0 = p0;
		this.p1 = p1;
	}

	//https://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect
	intersectSegment(segment, contacts)
	{		
		let p = this.p0;
		let r = this.p1.subtract(this.p0);
		let q = segment.p0;
		let s = segment.p1.subtract(segment.p0);
		let r_x_s = r.cross(s);
		let q_m_p = q.subtract(p);

		//collinear
		if(r_x_s == 0)
		{
			//on the same line
			if(q_m_p.cross(r) == 0)
			{
				let t0 = q_m_p.dot(r)/r.dot(r);
				let t1 = t0 + s.dot(r)/r.dot(r);

				if(t0 >= 0 && t0 <= 1 && t1 >= 0 && t1 <= 1)
				{
//					contacts.push(new Contact(p.x+t0*r.x,p.y+t0*r.y));
//					contacts.push(new Contact(q.x+t1*s.x,q.y+t1*s.y));
					return true;
				}
				return false
			}
			//non-overlapping
			else
			{
				return false;
			}
		}
		//crossing
		else
		{
			let t = q_m_p.cross(s)/r_x_s;
			let u = q_m_p.cross(r)/r_x_s;

			if(t >= 0 && t <= 1 && u >= 0 && u <= 1)
			{
//				contacts.push(new Contact(p.x+t*r.x,p.y+t*r.y));
				return true;
			}
			
			return false;
		}
	}

	intersectSphere(sphere, contacts)
	{
		sphere.intersectSegment(this, contacts);
	}

	draw(context)
	{
		context.moveTo(this.p0.x, this.p0.y);
		context.lineTo(this.p1.x, this.p1.y);
		context.stroke();
	}
}

class PointCollider extends Collider
{
	constructor(position)
	{
		super("point");
		this.position = position;
	}

	intersectSphere(sphere, contacts)
	{
		sphere.intersectPoint(this, contacts);
	}

	intersectOBB(obb, contacts)
	{
		obb.intersectPoint(this, contacts);
	}
}

class SphereCollider extends Collider
{
	constructor(position, r)
	{
		super("sphere");
		this.position = position;
		this.r = r;
	}
	
	intersectSegment(segment, contacts)
	{
		let OP = segment.p0.subtract(this.position);
		let OQ = segment.p1.subtract(this.position);
		let PQ = segment.p1.subtract(segment.p0);
		let minDist = Number.MAX_VALUE;
		let maxDist = Math.max(OP.dot(OP), OQ.dot(OQ));

		//The min is between the two points of the segment
		if(OP.dot(PQ) * OQ.dot(PQ) < 0)
		{
			
			minDist = OP.cross(OQ);
			minDist *= minDist / PQ.dot(PQ);
		}
		else
		{
			minDist = Math.min(OP.dot(OP), OQ.dot(OQ));
		}

		if(minDist <= this.r*this.r && maxDist >= this.r*this.r)
		{
			return true;
		}
		else
		{
			return false;
		}
	}
	
	intersectPoint(point, contacts)
	{
		let dr = this.position.subtract(point.position);

		if(dr.dot(dr) <= this.r*this.r)
		{
			return true;
		}

		return false;
	}

	intersectSphere(sphere, contacts)
	{
		let dr = this.position.subtract(sphere.position);

		if(dr.dot(dr) <= (this.r + sphere.r)*(this.r + sphere.r))
		{

			return true;
		}

		return false;
	}

	draw(context)
	{
		context.beginPath();
		context.arc(this.position.x,
					this.position.y, 
					this.r, 0, 2*Math.PI);
		context.stroke();
	}
}

class OBBCollider extends Collider
{
	constructor(position, width, height, theta)
	{
		super("OBB");
		this.position = position;
		this.width = width;
		this.height = height;
		this.theta = theta;
	}

	intersectPoint(point, contacts)
	{
		let pos = point.subtract(this.position);
		pos = pos.rotate(-this.theta);

		if(pos.x > this.width*0.5) return false;
		if(pos.x < -this.width*0.5) return false;
		if(pos.y > this.height*0.5) return false;
		if(pos.y < -this.height*0.5) return false;

		return true;
	}
}

class BezierCollider extends Collider
{
	constructor(nodes)
	{
		super("bezier");
	}

	intersectSegment(segment, contacts)
	{

	}

	//Solve roots of a.x^2 + b.x + c = 0;
	solveQuadratic(a, b, c)
	{
		let delta = b*b - 4*a*c;
		if(delta < 0) return {};
		if(delta == 0) return {x0:-b/(2*a)};
		return {x0:(-b-Math.sqrt(delta))/(2*a),
				x1:(-b+Math.sqrt(delta))/(2*a)};
	}
}
