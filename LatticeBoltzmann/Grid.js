class Cell
{
	constructor()
	{
		this.fIn = [0,0,0, 0,0,0, 0,0,0];
		this.fOut= [0,0,0, 0,0,0, 0,0,0];
		this.rho = 0;
		this.ux  = 0;
		this.uy  = 0;
	}
}

class Grid
{
	constructor(m, n, xMin, yMin, xMax, yMax)
	{
		this.m = m;
		this.n = n;
		this.cellWidth  = (xMax - xMin)/(this.m);
		this.cellHeight = (yMax - yMin)/(this.n);

		this.x = [];
		this.y = [];

		for(let i = 0; i<this.m; i++)
		{
			this.x.push(xMin+(i-0.5)*this.cellWidth);
		}
		for(let j = 0; j<this.n; j++)
		{
			this.y.push(yMin+(j-0.5)*this.cellHeight);
		}

		this.lowColor  = [0,0,255];
		this.highColor = [255,0,0];

		this.cells = [];
		
		for(let i = 0; i<this.m; i++)
		{
			for(let j = 0; j<this.n; j++)
			{
				this.cells.push(new Cell());
			}
		}
	}

	draw(context)
	{
		let minP = 0.0;
		let maxP = 0.3;
		for(let i = 0; i<this.m; i++)
		{
			for(let j = 0; j<this.n; j++)
			{
				let cell = this.getCell(i,j);
				let value = Math.sqrt(cell.ux*cell.ux + cell.uy*cell.uy);
				//let value = cell.uy;
				let alpha = value-minP;
				alpha /= (maxP-minP);
				
				let r = alpha*this.highColor[0]+(1-alpha)*this.lowColor[0];
				let g = alpha*this.highColor[1]+(1-alpha)*this.lowColor[1];
				let b = alpha*this.highColor[2]+(1-alpha)*this.lowColor[2];

				context.fillStyle = "rgb("+r+","+g+","+b+")";

				context.fillRect(this.x[i]+this.cellWidth/2, 
								 this.y[j]+this.cellHeight/2, 
						 		 this.cellWidth, this.cellHeight);

				this.drawArrow(context,this.x[i]+this.cellWidth/2,
								  this.y[j]+this.cellHeight/2,
								  cell.ux*50, cell.uy*50);
			}
		}
	}

	getCell(i,j)
	{
		return this.cells[i*this.n+j];
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
