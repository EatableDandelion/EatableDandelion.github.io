window.addEventListener('load', function(){
	const canvas = document.getElementById('canvas');
	const ctx = canvas.getContext('2d');
	canvas.width = 1400;
	canvas.height = 1000;


	class Parameters
	{	
		constructor()
		{
			this.Fr = 0.5;
			this.Re = 100;
			this.density = 1;
			this.M = 0.1;
			this.CFL = 0.5;

			this.L = canvas.width/2;
			this.dt0 = 16.67;
			this.h0 = 20;
			this.rho0 = 1;
//			this.m0 = 2*Math.PI*this.h0*this.h0*this.rho0;
			this.reset();
		}

		reset()
		{
			this.u0 = this.h0*this.CFL/this.dt0;
			this.g = this.u0*this.u0/(this.L*this.Fr*this.Fr);
			this.k = this.rho0*this.u0*this.u0/(this.M*this.M);
			this.mu = this.L*this.CFL*this.h0/(this.dt0*this.Re*this.rho0);
		}
	}

	class Game
	{
		constructor(width, height, context, element)
		{
			this.parameters = new Parameters();
			this.paused = true;
			this.width = width;
			this.height = height;
			this.UI =  new UI(width, height, element);
			this.particles = new ParticleSystem(width, height, 
												this.UI.mouse,
												this.parameters);

			let x = width/2;
			let y = height/2;
		}

		update(dt)
		{
			this.frame++;
			this.particles.update(dt);
		}

		draw(context, minValue, maxValue) 
		{
			this.UI.draw(context);
			this.particles.draw(context, minValue, maxValue);
		}
	}

	let game = new Game(canvas.width, canvas.height, ctx, canvas);
	let h = parseInt(document.getElementById("slider-radius").value);
	let color = document.getElementById("color-picker").value;
	let dtFactor = 1;
	let minValue = 0;
	let maxValue = 1;

	ctx.lineWidth = 5;
	document.getElementById("dt-slider").innerHTML = dtFactor;
	document.getElementById("dt-label").innerHTML = dtFactor;

	initUI();



	let lastTime = 0;

	function animate(timeStamp){
		const deltaTime = timeStamp - lastTime;
		lastTime = timeStamp;

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		game.draw(ctx, minValue, maxValue);
		if(!game.paused)
		{
			game.update(dtFactor * 9);
		}

		document.getElementById("particle-count").innerHTML = 
					game.particles.getNumberOfParticles();

		requestAnimationFrame(animate);
	}

	animate(0);


	function initUI()
	{
		canvas.oncontextmenu = function(e) {
    		e.preventDefault();
		};

		window.addEventListener('keydown', e => 
		{
			if(e.key == 'p') game.paused = !game.paused;
		});
	
		document.getElementById("start-button")
				.addEventListener("click", function()
		{
			game.paused = false;
			game.UI.visible = false;
			game.particles.particleVisible = true;
			game.particles.resultDisplay = "pressure";
			document.getElementById("ui-checkbox").checked = false;
			document.getElementById("particles-checkbox").checked = true;
			document.getElementById("result-checkbox").checked = true;
		});	

		document.getElementById("stop-button")
				.addEventListener("click", function()
		{
			game.paused = true;	
			game.UI.visible = true;
			game.particles.particleVisible =  false;
			game.particles.resultDisplay = "";
			document.getElementById("ui-checkbox").checked = true;
			document.getElementById("particles-checkbox").checked = false;
			document.getElementById("result-checkbox").checked = false;
		});	

		document.getElementById("reset-button")
				.addEventListener("click", function()
		{
			game.particles.reset();	
		});

	
		document.getElementById("ui-checkbox")
				.addEventListener("change", function()
		{
			game.UI.visible = 
					document.getElementById("ui-checkbox").checked;
		});
		
		document.getElementById("particles-checkbox")
				.addEventListener("change", function()
		{
			game.particles.particleVisible = 
					document.getElementById("particles-checkbox").checked;
		});
	
		document.getElementById("result-checkbox")
				.addEventListener("change", function()
		{
			if(document.getElementById("result-checkbox").checked)
			{
				game.particles.resultDisplay = document.getElementById
											  ("result-dropdown").value;
			}
			else
			{
				game.particles.resultDisplay = "";
			}
		});
		document.getElementById("result-dropdown")
				.addEventListener("click", function()
		{
			if(document.getElementById("result-checkbox").checked)
			{
				game.particles.resultDisplay = document.getElementById
											  ("result-dropdown").value;
			}
			else
			{
				game.particles.resultDisplay = "";
			}
		});
		document.getElementById("min-val")
				.addEventListener("input", function()
		{
			minValue = document.getElementById("min-val").value;	
		});
		document.getElementById("max-val")
				.addEventListener("input", function()
		{
			maxValue = document.getElementById("max-val").value;	
		});

		document.getElementById("dt-slider")
				.addEventListener("change", function()
		{
			dtFactor = 
				parseFloat(document.getElementById("dt-slider").value)
 			  +parseFloat(document.getElementById("dt-slider-micro").value);
			document.getElementById("dt-label").innerHTML = dtFactor;
		});
		document.getElementById("dt-slider-micro")
				.addEventListener("change", function()
		{
			dtFactor = 
				parseFloat(document.getElementById("dt-slider").value)
 			  +parseFloat(document.getElementById("dt-slider-micro").value);
			document.getElementById("dt-label").innerHTML = dtFactor;
		});

		document.getElementById("gravity-checkbox")
				.addEventListener("change", function()
		{
			if(document.getElementById("gravity-checkbox").checked)
			{
				game.particles.gravityToggle = 1;
			}
			else
			{
				game.particles.gravityToggle = 0;
			}
		});

		document.getElementById("slider-gravity")
				.addEventListener("change", function()
		{
//			game.particles
//				.setGravity(document.getElementById("slider-gravity")
//									.value);

	
			game.parameters.Fr = 
			parseFloat(document.getElementById("slider-gravity").value);

			game.parameters.reset();
	

			document.getElementById("label-gravity").innerHTML = 
				parseFloat(document.getElementById("slider-gravity").value);
		});


		document.getElementById("sgravity-checkbox")
				.addEventListener("change", function()
		{
			if(document.getElementById("sgravity-checkbox").checked)
			{
				game.particles.selfGravityToggle = 1;
			}
			else
			{
				game.particles.selfGravityToggle = 0;
			}
		});

		document.getElementById("slider-sgravity")
				.addEventListener("change", function()
		{
			game.particles.setSelfGravity(
				parseInt(document.getElementById("slider-sgravity")
									.value));
			document.getElementById("label-sgravity").innerHTML = 
					document.getElementById("slider-sgravity").value;
		});

		document.getElementById("viscosity-checkbox")
				.addEventListener("change", function()
		{
			if(document.getElementById("viscosity-checkbox").checked)
			{
				game.particles.viscosityToggle = 1;
			}
			else
			{
				game.particles.viscosityToggle = 0;
			}
		});
		document.getElementById("slider-viscosity")
				.addEventListener("change", function()
		{
//			game.particles
//				.setViscosity(
//				parseInt(document.getElementById("slider-viscosity")
//									.value));

			game.parameters.Re = 
			parseInt(document.getElementById("slider-viscosity").value);

			game.parameters.reset();
			document.getElementById("label-viscosity").innerHTML = 
					document.getElementById("slider-viscosity").value;
		});

		document.getElementById("slider-cs")
				.addEventListener("change", function()
		{
//			game.particles
//				.setSpeedOfSound(
//				parseInt(document.getElementById("slider-cs").value));

			game.parameters.M = 
			parseFloat(document.getElementById("slider-cs").value);

			game.parameters.reset();

			document.getElementById("label-cs").innerHTML = 
					document.getElementById("slider-cs").value;
		});







		document.getElementById("inflow-button")
				.addEventListener("click", function()
		{
			game.particles.addBC(new Inflow(h,
								canvas.width*0.5, canvas.height*0.45,
								canvas.width*0.5, canvas.height*0.65, 
								game.UI, color));

			addToBCDropDown("Input");
		});	

		document.getElementById("outflow-button")
				.addEventListener("click", function()
		{
			game.particles.addBC(new Outflow(
								canvas.width*0.5, canvas.height*0.45,
								canvas.width*0.5, canvas.height*0.65, 
								game.UI));
			addToBCDropDown("Outflow");
		});

		document.getElementById("force-button")
				.addEventListener("click", function()
		{
			game.particles.addBC(new BodyForce(0.01,
								canvas.width*0.5, canvas.height*0.45,
								canvas.width*0.5, canvas.height*0.65, 
								game.UI));
			addToBCDropDown("Body force");
		});

		document.getElementById("wall-button")
				.addEventListener("click", function()
		{
			game.particles.addBC(new Wall(h, game.UI));
			addToBCDropDown("Wall");
		});

		document.getElementById("RB-button")
				.addEventListener("click", function()
		{
			game.particles.addBC(new RigidBodySpawn(h, game.UI, 
													game.particles));
			addToBCDropDown("Rigid body");
		});

		document.getElementById("rect-spawn-button")
				.addEventListener("click", function()
		{
			game.particles.addBC(new RectangleSpawn(h,
								canvas.width*0.5, canvas.height*0.45,
								color, game.UI));
			addToBCDropDown("Spawn");
		});
		
		
		document.getElementById("slider-radius")
				.addEventListener("change", function()
		{
			h = parseInt(document.getElementById("slider-radius").value);
			document.getElementById("radius-label").innerHTML = h;

			bc = getSelectedElement();
			if(bc != undefined)
			{
				if(bc.h != undefined)
					bc.h = h;
			}
		});

		document.getElementById("color-picker")
				.addEventListener("change", function()
		{
			color = document.getElementById("color-picker").value;
			bc = getSelectedElement();
			if(bc != undefined)
			{
				if(bc.color != undefined)
					bc.color = color;
			}
		});

		document.getElementById("delete-button")
				.addEventListener("click", function()
		{
			bc = getSelectedElement();
			if(bc != undefined)
			{
				bc.remove();	
				let e = document.getElementById("component-dropdown");
				e.remove(e.selectedIndex);
			}
		});
	}

	function getSelectedElement()
	{
		let bc = document.getElementById("component-dropdown").value;
		return game.particles.getBC(parseInt(bc));
	}

	function addToBCDropDown(name)
	{
		let id = game.particles.bcIds-1;
		let dropDown = document.getElementById("component-dropdown");
		let newElement = document.createElement("option");
		newElement.setAttribute("value",id);
		newElement.setAttribute("selected","true");
		newElement.appendChild(document.createTextNode(name+" "+id));
		dropDown.appendChild(newElement);
	}
});
