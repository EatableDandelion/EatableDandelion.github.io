

class LBM
{
	constructor(width, height, m, n)
	{
		this.u0 = 0.0;
		this.width = width;
		this.height = height;
		this.m = m;
		this.n = n;
		this.w   = [4/9, 1/9, 1/9, 1/9, 1/9, 1/36, 1/36, 1/36, 1/36];
		this.cx  = [ 0 ,  1 ,  0 , -1 ,  0 ,   1 ,  -1 ,  -1 ,   1 ];
		this.cy  = [ 0 ,  0 ,  1 ,  0 , -1 ,   1 ,   1 ,  -1 ,  -1 ];
		this.opp = [ 0 ,  3 ,  4 ,  1 ,  2 ,   7 ,   8 ,   5 ,   6 ];
		this.grid = new Grid(this.m, this.n, 0, 0, this.width, this.height);
		this.grid.cells.forEach(cell =>
		{
			this.init(cell);
		});

		this.grid.cells.forEach(cell => 
		{
			this.setMacroVariables(cell);
		});

		this.wallCells = [];
		this.wall

		for(let i = m/4-10; i<m/4+10; i++)
		{
			for(let j = n/2-10; j<n/2+10; j++)
			{
				if((i-m/4)*(i-m/4)+(j-n/2)*(j-n/2) > 20)continue;
				this.wallCells.push(this.grid.getCell(i,j));
			}
		}
//		for(let j = n/2-10; j<n/2+10; j++)
//				this.wallCells.push(this.grid.getCell(m/2+j-n/2,j));
	}

	update(dt)
	{
		this.u0 += 0.001;
		this.u0 = Math.min(0.1,this.u0);

		this.grid.cells.forEach(cell =>
		{
			this.setMacroVariables(cell);
		});
		
		this.setMacroBC();


		this.grid.cells.forEach(cell =>
		{
			this.collisionStep(cell);
		});


		this.setMicroBC();

		this.streamingStep();
	}

	init(cell)
	{
		for(let k = 0; k<9; k++)
		{
			cell.fIn[k] = this.w[k];//1.0;
		}
	}

	setMacroVariables(cell)
	{
		cell.rho = 0;
		cell.ux  = 0;
		cell.uy  = 0;

		for(let k = 0; k<9; k++)
		{
			cell.rho += cell.fIn[k];
			cell.ux  += cell.fIn[k]*this.cx[k];
			cell.uy  += cell.fIn[k]*this.cy[k];
		}
		cell.ux /= cell.rho;
		cell.uy /= cell.rho;
	}

	setMacroBC()
	{
		for(let j = 1; j<this.n-1; j++)
		{
			let cell = this.grid.getCell(0,j);
			cell.ux = this.u0;
			cell.uy = 0.0;
			cell.rho = 1/(1-cell.ux)*(cell.fIn[0]+cell.fIn[2]+cell.fIn[4]
								+2*(cell.fIn[3]+cell.fIn[6]+cell.fIn[7]));

			
			cell = this.grid.getCell(this.m-1,j);
			cell.rho = this.grid.getCell(this.m-2,j).rho;
			cell.ux = this.grid.getCell(this.m-2,j).ux;
			cell.uy = 0.0;
		}
	}

	setMicroBC()
	{
		let fEq = [0,0,0, 0,0,0, 0,0,0];
		for(let k = 0; k<9; k++)
		{
			for(let j = 1; j<this.n-1; j++)
			{
				let cell = this.grid.getCell(0,j);
				
				let cu = 3*(this.cx[k]*cell.ux+this.cy[k]*cell.uy);
				fEq[k] = (1 + cu + 0.5*cu*cu
					      - 1.5*(cell.ux*cell.ux + cell.uy*cell.uy));
				fEq[k] *= this.w[k]*cell.rho;


				cell.fOut[k] = fEq[k]+18*this.w[k]*this.cx[k]*this.cy[k]
							 *(cell.fIn[7]-fEq[7]
							  -cell.fIn[6]+fEq[6]);

				cell = this.grid.getCell(this.m-1,j);
				cell.fOut[k] = fEq[k]+18*this.w[k]*this.cx[k]*this.cy[k]
							 *(cell.fIn[5]-fEq[5]
							  -cell.fIn[8]+fEq[8]);
			}
	
			this.wallCells.forEach(wall =>
			{
				wall.fOut[k] = wall.fIn[this.opp[k]];
			});
		}
	}

	collisionStep(cell)
	{
		let omega = 1/0.7;
		let fEq = [0,0,0, 0,0,0, 0,0,0];

		for(let k = 0; k<9; k++)
		{
			let cu = 3*(this.cx[k]*cell.ux+this.cy[k]*cell.uy);
			fEq[k] = (1 + cu + 0.5*cu*cu
					      - 1.5*(cell.ux*cell.ux + cell.uy*cell.uy));
			fEq[k] *= this.w[k]*cell.rho;

			cell.fOut[k] = (1-omega)*cell.fIn[k] + omega*fEq[k];
		}
	}
	
	streamingStep()
	{
		for(let i = 0; i<this.m-1; i++)
		{
			for(let j = 0; j<this.n; j++)
			{
				for(let k = 0; k<9; k++)
				{
					let iNew = i + this.cx[k];
					let jNew = j + this.cy[k];

					if(iNew == -1) iNew = this.m - 1;
					else if(iNew == this.m) iNew = 0;

					if(jNew == -1) jNew = this.n - 1;
					else if(jNew == this.n) jNew = 0;


					this.grid.getCell(iNew,jNew).fIn[k] =
							this.grid.getCell(i,j).fOut[k];
				}
			}
		}
	}

	draw(context)
	{
		this.grid.draw(context);
	}
}
