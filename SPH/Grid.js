
class Cell
{
	constructor()
	{
		this.neighbors = [];
	}
}

class Grid
{
	constructor(m, n, xMin, yMin, xMax, yMax, mouse)
	{
		this.m = m;
		this.n = n;
		this.u = new Mat(this.m-1, this.n-1);
		this.v = new Mat(this.m-1, this.n-1);
		this.P = new Mat(this.m-1, this.n-1);
		this.e = new Mat(this.m-1, this.n-1);
		this.T = new Mat(this.m-1, this.n-1);
		this.rho = new Mat(this.m-1, this.n-1);
		this.test = new Mat(this.m-1, this.n-1);
		this.counter = new Mat(this.m-1, this.n-1);
		this.cellWidth  = (xMax - xMin)/(this.m - 1);
		this.cellHeight = (yMax - yMin)/(this.n - 1);
		this.mouse = mouse;

		this.x = [];
		this.y = [];

		for(let i = 0; i<this.m-1; i++)
		{
			this.x.push(xMin+(i+0.5)*this.cellWidth);
		}
		for(let j = 0; j<this.n-1; j++)
		{
			this.y.push(yMin+(j+0.5)*this.cellHeight);
		}

		this.lowColor  = [0,0,255];
		this.highColor = [255,0,0];

		this.cells = [];
		
		for(let i = 0; i<this.m-1; i++)
		{
			for(let j = 0; j<this.n-1; j++)
			{
				this.cells.push(new Cell());
			}
		}
	}

	getCell(i, j)
	{
		return this.cells[i*(this.n-1)+j];
	}

	getNeighbors(particle)
	{
		let x = particle.x;
		let y = particle.y;
		let xMin = this.x[0];
		let yMin = this.y[0];
		let xMax = this.x[this.m-2];
		let yMax = this.y[this.n-2];

		let i = Math.round((this.m-1)*(x-xMin)/(xMax-xMin)-0.5);
		let j = Math.round((this.n-1)*(y-yMin)/(yMax-yMin)-0.5);

		let neighbors = [];

		for(let i0 = Math.max(0,i-1); i0<=Math.min(this.m-2,i+1); i0++)
		{
			for(let j0 = Math.max(0,j-1); j0<=Math.min(this.n-2,j+1); j0++)
			{
				neighbors = neighbors.concat(this.getCell(i0,j0).neighbors);
			}
		}

		return neighbors;
	}

	draw(context, variableName, min, max)
	{
		let variable = this.P;
		let drawVelocity = false;

		if(variableName == "u")
		{
			variable = this.u;
		}
		else if(variableName == "v")
		{
			variable = this.v;
		}
		else if(variableName == "e")
		{
			variable = this.e;
		}
		else if(variableName == "T")
		{
			variable = this.T;
		}
		else if(variableName == "vector")
		{
			drawVelocity = true;
		}
		else if(variableName == "rho")
		{
			variable = this.rho;
		}
		else if(variableName == "test")
		{
			variable = this.test;
		}



		let minP = min;
		let maxP = max;
		let maxU = 0;


		for(let i = 0; i<this.m; i++)
		{
			for(let j = 0; j<this.n; j++)
			{
				if(this.counter.get(i,j) == 0) continue;

				let value = this.u.get(i,j)/this.counter.get(i,j)
					  * this.u.get(i,j)/this.counter.get(i,j)
					  +	this.v.get(i,j)/this.counter.get(i,j)
					  *	this.v.get(i,j)/this.counter.get(i,j);

				if(!isNaN(value))
				{
					maxU = Math.max(value, maxU);
				}
			}
		}

		maxU = Math.sqrt(maxU);

		for(let i = 0; i<this.m; i++)
		{
			for(let j = 0; j<this.n; j++)
			{
				if(this.counter.get(i,j) == 0) continue;

				let value = variable.get(i,j)/this.counter.get(i,j);
				let alpha = value-minP;
				alpha /= (maxP-minP);
				
				let r = alpha*this.highColor[0]+(1-alpha)*this.lowColor[0];
				let g = alpha*this.highColor[1]+(1-alpha)*this.lowColor[1];
				let b = alpha*this.highColor[2]+(1-alpha)*this.lowColor[2];

				context.fillStyle = "rgb("+r+","+g+","+b+")";

				context.fillRect(this.x[i]-this.cellWidth/2, 
								 this.y[j]-this.cellHeight/2, 
						 		 this.cellWidth, this.cellHeight);

				if(drawVelocity)
				{
					value = this.u.get(i,j)/this.counter.get(i,j);
					let u0 = value/maxU*this.cellWidth/2;
					value = this.v.get(i,j)/this.counter.get(i,j);
					let v0 = value/maxU*this.cellWidth/2;

					this.drawArrow(context, this.x[i], this.y[j], u0, v0);
				}
			}
		}

		let i = this.getI(this.mouse.x);
		let j = this.getJ(this.mouse.y);

		if(this.getCell(i,j) != undefined)
		{
			if(this.counter.get(i,j) > 0)
			{
				document.getElementById("current-val").innerHTML = 
				(variable.get(i,j)/this.counter.get(i,j)).toExponential(3);
			}
		}
	}

	getI(x)
	{
		let xMin = this.x[0];
		let xMax = this.x[this.m-2];

		return Math.round((this.m-1)*(x-xMin)/(xMax-xMin)-0.5);
	}

	getJ(y)
	{
		let yMin = this.y[0];
		let yMax = this.y[this.n-2];

		return Math.round((this.n-1)*(y-yMin)/(yMax-yMin)-0.5);
	}

	add(particle)
	{
		let i = this.getI(particle.x);
		let j = this.getJ(particle.y);

		this.u.increment(i, j, particle.vx);
		this.v.increment(i, j, particle.vy);
		this.P.increment(i, j, particle.P);
		this.T.increment(i, j, particle.T);
		this.rho.increment(i, j, particle.rho);
		this.test.increment(i, j, particle.test);
		this.e.increment(i, j, particle.e + 0.5 * (particle.vx*particle.vx
											 + particle.vy*particle.vy));

		this.counter.increment(i, j, 1);

		i = Math.max(0, Math.min(this.m-2, i));
		j = Math.max(0, Math.min(this.n-2, j));
		
		if(this.getCell(i,j) == undefined) return;
		this.getCell(i,j).neighbors.push(particle);
	}

	clearGrid()
	{
		for(let i = 0; i<this.m-1; i++)
		{
			for(let j = 0; j<this.n-1; j++)
			{
				this.getCell(i,j).neighbors = [];
			}
		}
	}

	reset()
	{
		this.u = new Mat(this.m-1, this.n-1);
		this.v = new Mat(this.m-1, this.n-1);
		this.P = new Mat(this.m-1, this.n-1);
		this.counter = new Mat(this.m-1, this.n-1);
	}

	drawArrow(context, x, y, u, v)
	{
		let theta = Math.atan2(v, u);
		let l = Math.sqrt(u*u + v*v);
		context.beginPath();
		context.translate(x, y);
		context.rotate(theta);
		context.moveTo(0, 0);
		context.lineTo(l, 0);
		context.stroke();
		context.moveTo(l*0.75, l*0.25);
		context.lineTo(l,0);
		context.lineTo(l*0.75,-l*0.25);
		context.stroke();
		context.rotate(-theta);
		context.translate(-x,-y);
	}
}
