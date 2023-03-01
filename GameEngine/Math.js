class Vector
{
	constructor(x, y)
	{
		this.x = x;
		this.y = y;
	}

	dot(v)
	{
		return this.x*v.x + this.y*v.y;
	}

	cross(v)
	{
		return this.x*v.y - this.y*v.x;
	}
	
	add(v)
	{
		return new Vector(this.x+v.x, this.y+v.y);
	}

	subtract(v)
	{
		return new Vector(this.x-v.x, this.y-v.y);
	}

	multiply(f)
	{
		return new Vector(this.x*f, this.y*f);
	}

	length()
	{
		return Math.sqrt(this.x*this.x + this.y*this.y);
	}

	distance(v)
	{
		return (this.subtract(v)).length();
	}

	relativeToAbsolute(theta, x0, y0)
	{
		this.rotate(theta);
		this.x += x0;	
		this.y += y0;	
	}

	absoluteToRelative(theta, x0, y0)
	{
		this.x -= x0;
		this.y -= y0;

		this.rotate(-theta);
	}

	rotate(theta)
	{
		let temp = this.x*Math.cos(theta) - this.y*Math.sin(theta);
		this.y = this.x*Math.sin(theta) + this.y*Math.cos(theta);
		this.x = temp;
	}
};

class Mat
{
	constructor(m,n)
	{
		this.m = m;
		this.n = n;
		this.vals = [];
		for(let k = 0; k<m*n; k++)
			this.vals.push(0.0);
	}

	set(i,j,v)
	{
		this.vals[i*this.n+j] = v;
	}

	get(i,j)
	{
		return this.vals[i*this.n+j];
	}

	mult(A)
	{
		let res = new Mat(this.m, A.n);
		for(let i = 0; i<this.m; i++)
		{
			for(let j = 0; j<A.n; j++)
			{
				let sum = 0;
				for(let k = 0; k<this.n; k++)
				{
					sum += this.get(i,k) * A.get(k,j);
				}
				res.set(i,j,sum);
			}
		}
		return res;
	}

	add(A)
	{
		let res = new Mat(this.m, this.n);
		for(let i = 0; i<this.m; i++)
		{
			for(let j = 0; j<this.n; j++)
			{
				res.set(i,j, this.get(i,j) + A.get(i,j));
			}
		}
		return res;	
	}

	increment(i, j, f)
	{
		this.set(i, j, this.get(i, j) + f);
	}

	multiply(f)
	{
		let res = new Mat(this.m, this.n);
		for(let i = 0; i<this.m; i++)
		{
			for(let j = 0; j<this.n; j++)
			{
				res.set(i,j, this.get(i,j)*f);
			}
		}
		return res;	
	}	

	getMin()
	{
		let res = this.get(0,0);
		for(let i = 0; i<this.m; i++)
		{
			for(let j = 0; j<this.n; j++)
			{
				res = Math.min(res, this.get(i,j));
			}
		}
		return res;	
	}

	getMax()
	{
		let res = this.get(0,0);
		for(let i = 0; i<this.m; i++)
		{
			for(let j = 0; j<this.n; j++)
			{
				res = Math.max(res, this.get(i,j));
			}
		}
		return res;	
	}

	getTranspose()
	{
		let res = new Mat(this.n, this.m);
		for(let i = 0; i<this.m; i++)
		{
			for(let j = 0; j<this.n; j++)
			{
				res.set(j,i,this.get(i,j));
			}
		}
		return res;
	}

	getInverse()
	{
		let res = new Mat(3,3);

		let det = this.get(0,0)
				*(this.get(1,1)*this.get(2,2)-this.get(2,1)*this.get(1,2))
				- this.get(1,0)
				*(this.get(0,1)*this.get(2,2)-this.get(2,1)*this.get(0,2))
				+ this.get(2,0)
				*(this.get(0,1)*this.get(1,2)-this.get(1,1)*this.get(0,2))

		if(det == 0) return res;

		res.set(0,0,this.get(1,1)*this.get(2,2)-this.get(2,1)*this.get(1,2));
		res.set(0,1,this.get(0,2)*this.get(2,1)-this.get(2,2)*this.get(0,1));
		res.set(0,2,this.get(0,1)*this.get(1,2)-this.get(1,1)*this.get(0,2));
		res.set(1,0,this.get(1,2)*this.get(2,0)-this.get(2,2)*this.get(1,0));
		res.set(1,1,this.get(0,0)*this.get(2,2)-this.get(2,0)*this.get(0,2));
		res.set(1,2,this.get(0,2)*this.get(1,0)-this.get(1,2)*this.get(0,0));
		res.set(2,0,this.get(1,0)*this.get(2,1)-this.get(2,0)*this.get(1,1));
		res.set(2,1,this.get(0,1)*this.get(2,0)-this.get(2,1)*this.get(0,0));
		res.set(2,2,this.get(0,0)*this.get(1,1)-this.get(1,0)*this.get(0,1));

		for(let i = 0; i<this.m; i++)
		{
			for(let j = 0; j<this.n; j++)
			{
				res.set(i,j,res.get(i,j)/det);
			}
		}
		return res;	
	}
}
