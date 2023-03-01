window.addEventListener('load', function(){
	const canvas = document.getElementById('canvas');
	const ctx = canvas.getContext('2d');
	canvas.width = 1400;
	canvas.height = 1000;
	

	class Game
	{
		constructor(width, height, context, element)
		{
			this.paused = true;
			this.width = width;
			this.height = height;
			this.UI =  new UI(width, height, element);
			this.particles = new ParticleSystem(width, height);
		}

		update(dt)
		{
			this.frame++;
			this.particles.update(dt);
		}

		draw(context, paused)
		{
			this.UI.draw(context);
			this.particles.draw(context, paused);
		}
	}

	let game = new Game(canvas.width, canvas.height, ctx, canvas);
	let h = parseInt(document.getElementById("slider-radius").value);
	let color = document.getElementById("color-picker").value;
	ctx.lineWidth = 5;
	let dtFactor = 1;

	initUI();


	let lastTime = 0;

	function animate(timeStamp){
		const deltaTime = timeStamp - lastTime;
		lastTime = timeStamp;

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		game.draw(ctx, game.paused);
		if(!game.paused)
		{
			game.update(dtFactor * deltaTime);
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



	
		document.getElementById("dt-slider").innerHTML = dtFactor;
		document.getElementById("dt-label").innerHTML = dtFactor;
		document.getElementById("dt-slider")
				.addEventListener("change", function()
		{
			dtFactor = document.getElementById("dt-slider").value;
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
			game.particles
				.setGravity(document.getElementById("slider-gravity")
									.value);
			document.getElementById("label-gravity").innerHTML = 
					document.getElementById("slider-gravity").value;
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
			game.particles
				.setViscosity(
				parseInt(document.getElementById("slider-viscosity")
									.value));
			document.getElementById("label-viscosity").innerHTML = 
					document.getElementById("slider-viscosity").value;
		});

		document.getElementById("slider-cs")
				.addEventListener("change", function()
		{
			game.particles
				.setSpeedOfSound(
				parseInt(document.getElementById("slider-cs").value));

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
