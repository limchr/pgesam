const sample_resolution = 5;

var canvas = null;
var canvas_context = null;
var svg = null;
var slider = null;
var sliderValue = null;
var current_circle = null;
var current_pitch = 60;
var current_timbre = [0.0, 0.0];
var current_octave = 60;

document.addEventListener("DOMContentLoaded", function(event) {
    canvas = document.getElementById('selection_canvas');
    canvas_context = canvas.getContext('2d');
    svg = document.getElementById('selection_svg');

    slider = document.getElementById("size_slider");
    sliderValue = document.getElementById("slider_value");

    // Make the canvas, svg, and container square
    let s = square_elem(canvas);
    square_elem(svg, s);
    square_elem(document.getElementById('selection_div'), s);

    svg.addEventListener('click', e => {
        let mouse_xy = get_mouse_position(e);
        let relative_xy = [
            mouse_xy[0] / svg.clientWidth,
            mouse_xy[1] / svg.clientHeight
        ];
        // Adjust y coordinate and clamp values
        relative_xy = [clamp(relative_xy[0], 0.0, 0.999), 1 - clamp(relative_xy[1], 0.0, 0.999)];
        
        // Compute the sample indices (using external models and active_model)
        let squareIndex = [
            Math.floor(relative_xy[0] * sample_resolution),
            Math.floor(relative_xy[1] * sample_resolution)
        ];
		current_timbre = [squareIndex[0], squareIndex[1]];
        let wav_path = 'data/generate_audio/' +
		pad(current_pitch, 3) + '_' + pad(squareIndex[0], 3) + '_' + pad(squareIndex[1], 3) + '.wav';
        console.log(mouse_xy[0] + ' ' + mouse_xy[1] + ' - ' +
                    squareIndex[0] + ' ' + squareIndex[1] + ' ' + wav_path);
        play_wav(wav_path);

        // Create and animate the click effect (circle)
		if(current_circle != null) {
			svg.removeChild(current_circle);
		}
		
        let circle_pos = [relative_xy[0] * 2 - 1, (1 - relative_xy[1]) * 2 - 1];
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', circle_pos[0]);
        circle.setAttribute('cy', circle_pos[1]);
        circle.setAttribute('r', 0.04); // circle radius
        circle.setAttribute('fill', 'rgb(100,100,100)');
        circle.setAttribute('stroke', 'black');
        circle.setAttribute('stroke-width', 0.002);
        svg.appendChild(circle);
		current_circle = circle;

        //fadeOut(circle, 1000);
    }, true);




    slider.addEventListener("input", function() {
        change_pitch(slider.value);
    });
    
    function change_pitch(value) {
		sliderValue.textContent = value;
		slider.value = value;
		current_pitch = value;
        console.log("Slider changed to:", current_pitch);
        change_img("data/generate_scatter/" + pad(current_pitch, 3) + ".svg");
    }

	change_pitch(current_pitch);

	// Mapping of computer keys to semitone shifts relative to a base note (e.g., "A")
	const keyToSemitone = {
		'a': 0,    // Base note
		'w': 1,    // One semitone up
		's': 2,    // Two semitones up
		'e': 3,    // Three semitones up
		'd': 4,    // Four semitones up
		'f': 5,    // Five semitones up
		't': 6,    // Six semitones up
		'g': 7,    // Seven semitones up
		'y': 8,    // Eight semitones up
		'h': 9,    // Nine semitones up
		'u': 10,   // Ten semitones up
		'j': 11,   // Eleven semitones up
		'k': 12    // One octave above the base
	};
	
	// Listen for keydown events
	document.addEventListener("keydown", function (event) {
		// Ignore repeated key events
		if (event.repeat) return;
		const key = event.key.toLowerCase();
		if (keyToSemitone.hasOwnProperty(key)) {
			// Calculate playback rate using 2^(n/12) where n is the semitone difference
			const semitone = keyToSemitone[key] + current_octave;
			change_pitch(semitone);
			let wav_path = 'data/generate_audio/' +
			pad(current_pitch, 3) + '_' + pad(current_timbre[0], 3) + '_' + pad(current_timbre[1], 3) + '.wav';
			play_wav(wav_path);
		} else if(key == 'q') {
			if(current_octave == 48) {
				current_octave = 60;
			} else {
				current_octave = 48;
			}
		}
	});
  

});

//
// Helper Functions
//

// Load an image and draw it on the canvas
function change_img(img_path) {
    var img = new Image();
    img.src = img_path;
    img.onload = function() {
        set_canvas_image(canvas, canvas_context, this, this.width);
    };
}

// Play an audio file
function play_wav(path) {
    var audio = new Audio(path);
    audio.play();
}

// Make an HTML element square (if s is null, use element's width)
function square_elem(elem, s = null) {
    if (s == null) s = elem.clientWidth;
    elem.style.width = s + 'px';
    elem.style.height = s + 'px';
    elem.width = s;
    elem.height = s;
    return s;
}

// Draw the image onto the canvas, scaling it to fit
function set_canvas_image(canvas, context, image, csize) {
    context.drawImage(image, 0, 0, csize, csize, 0, 0, canvas.clientWidth, canvas.clientHeight);
}

// Pad numbers with leading zeros
function pad(num, size) {
    var s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
}

// Clamp a numeric value between min and max
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// Get mouse position relative to the target element
function get_mouse_position(e) {
    let element = e.target, offsetX = 0, offsetY = 0;
    while (element !== null) {
        if (element.offsetParent !== undefined) {
            do {
                offsetX += element.offsetLeft;
                offsetY += element.offsetTop;
            } while ((element = element.offsetParent));
            break;
        }
        element = element.parentNode;
    }
    let mx = e.pageX - offsetX;
    let my = e.pageY - offsetY;
    return [mx, my];
}

// Fade out an SVG element over a given duration (in milliseconds)
function fadeOut(element, duration) {
    let opacity = 1;
    const start = performance.now();
    function animate(currentTime) {
        const elapsed = currentTime - start;
        opacity = 1 - elapsed / duration;
        if (opacity <= 0) {
            element.parentNode.removeChild(element);
        } else {
            element.setAttribute('fill-opacity', opacity);
            element.setAttribute('stroke-opacity', opacity);
            requestAnimationFrame(animate);
        }
    }
    requestAnimationFrame(animate);
}
