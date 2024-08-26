'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

/** VERSION 1
let map, mapEvent;

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        function (position) {
            const { latitude, longitude } = position.coords;

            const coords = [latitude, longitude];
            console.log(coords);

            map = L.map('map', {
                minZoom: 3,
                maxZoom: 18,
            }).setView(coords, 13);

            L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            map.on('click', function (mapE) {
                mapEvent = mapE;
                form.classList.remove('hidden');
                inputDistance.focus();
            })
        },
        function() {
            alert('Could not get your position');
        }, {
            maximumAge: 10000,
        }
    )
}

form.addEventListener('submit', function (e) {
    e.preventDefault();

    // reset input fields
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';

    // focust on distance input
    inputDistance.focus();

    // input type back to running
    inputType.value = 'running';

    // show marker
    const { lat, lng } = mapEvent.latlng;
    const coordsEvent = [lat, lng];
    L.marker(coordsEvent, {
        title: `diepchiaser is here. ${lat}, ${lng}`,
        shadowPane: 'shadowPane',
        riseOnHover: true,
    })
        .addTo(map)
        .bindPopup(
            L.popup([lat, lng], {
                autoClose: false,
                maxWidth: 250,
                minWidth: 100,
                closeOnClick: false,
                className: 'running-popup',
            })
        )
        .setPopupContent(`diepchiaser running here`)
        .openPopup();
});

inputType.addEventListener('change', function () {;
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
});

/** VERSION 2 */

class Workout {
  id = Date.now().toLocaleString().replace(/,/g, '');
  date = new Date();

  constructor(distance, duration, coords) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  #name;
  type = 'running';

  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this.clacPage();
    this._setDescription();
  }

  clacPage() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  #name;
  type = 'cycling';

  constructor(distance, duration, coords, elevationGain) {
    super(distance, duration, coords);
    this.elevationGain = elevationGain;
    this.clacSpeed();
    this._setDescription();
  }

  clacSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}
class App {
  #map;
  #mapEvent;
  #workouts = [];
  #edit = false;

  constructor() {
    // get user's position
    this._getPosition();

    // get data from local storage
    this._getlocalStorage();

    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toogleElevationField);
    containerWorkouts.addEventListener('click', this._clickWorkout.bind(this));
  }

  async _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        await this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        },
      );
    }
  }

  async _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) {
    this.#edit = false;
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
    inputType.value = 'running';
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
  }

  _hideForm() {
    // empty input fields
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toogleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _isValidInput() {
    // helper functions
    const validInputs = (...inputs) =>
      inputs.every(input => Number.isFinite(input));
    const allPositive = (...inputs) => inputs.every(input => input > 0);

    return (
      !validInputs(distance, duration, cadence) ||
      !allPositive(distance, duration, cadence)
    );
  }

  _newWorkout(e) {
    e.preventDefault();

    // helper functions
    const validInputs = (...inputs) =>
      inputs.every(input => Number.isFinite(input));
    const allPositive = (...inputs) => inputs.every(input => input > 0);

    // declare workout
    let workout;

    // get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;

    // if workout running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // check if data is valid
      if (this._isValidInput()) {
        return alert('Input have to be positive number');
      }

      if (this.#edit) {
        workout = this._updateWorkout();
      } else {
        workout = new Running(distance, duration, [lat, lng], cadence);
      }
    }

    // if workout cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      // check if data is valid
      if (this._isValidInput()) {
        return alert('Input have to be positive number');
      }

      if (this.#edit) {
        workout = this._updateWorkout();
      } else {
        workout = new Cycling(distance, duration, [lat, lng], elevation);
      }
    }

    if (!this.#edit) {
      // add new object to workout array
      this.#workouts.push(workout);
    }

    // render workout on map as marker
    this._renderWorkoutMarker(workout);

    // render workout on list
    this._renderWorkout(workout);

    // hide form + clear input fields
    this._hideForm();

    // set local storage
    this._setLocalStorage();

    this.#edit = !this.#edit;
  }

  _updateWorkout(workout) {
    const data = this.#workouts.find(work => work.id === this.#map.workoutId);
    if (!data) return;

    data.type = type;
    data.distance = distance;
    data.duration = duration;
    data.elevationGain = elevation;

    return data;
  }

  _renderWorkoutMarker(workout) {
    if (!workout) return;

    L.marker(workout.coords, {
      title: `diep`,
      shadowPane: 'shadowPane',
      riseOnHover: true,
    })
      .addTo(this.#map)
      .bindPopup(
        L.popup(workout.coords, {
          autoClose: false,
          maxWidth: 250,
          minWidth: 100,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        }),
      )
      .setPopupContent(`diepchiaser ${workout.description}`)
      .openPopup();
  }

  _renderWorkout(workout) {
    if (!workout) return;
    const workoutEl = document.querySelector(
      `.workout[data-id="${workout.id}"]`,
    );
    const html = this._renderHtml(workout, workout.type === 'running');
    if (workoutEl) {
      workoutEl.outerHTML = html;
    } else {
      form.insertAdjacentHTML('afterend', html);
    }
  }

  _renderHtml(workout, isRunning = false) {
    return `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${isRunning ? '🏃‍♂️' : '🚴‍♀️'}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${isRunning ? workout.pace.toFixed(1) : workout.speed.toFixed(1)}</span>
            <span class="workout__unit">${isRunning ? 'min/km' : 'km/h'}</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">${isRunning ? '🦶🏼' : '⛰'}</span>
            <span class="workout__value">${isRunning ? workout.cadence : workout.elevationGain}</span>
            <span class="workout__unit">${isRunning ? 'spm' : 'm'}</span>
          </div>
        </li>
        `;
  }

  _setLocalStorage() {
    localStorage.setItem(`workouts`, JSON.stringify(this.#workouts));
  }

  _clickWorkout(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id,
    );

    // show mark
    this.#map.setView(workout.coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    // show form
    form.classList.remove('hidden');

    const type = workout.type;
    const lat = workout.coords[0] ?? '';
    const lng = workout.coords[1] ?? '';
    this._toogleElevationField();
    this.#map.latlng = { lat: lat, lng: lng };
    this.#edit = true;
    this.#map.workoutId = workout.id;

    inputType.value = type;
    inputDistance.value = workout.distance;
    inputDuration.value = workout.duration;
    if (type === 'running') {
      inputCadence.value = workout.cadence;
    }

    if (type === 'cycling') {
      inputElevation.value = workout.elevationGain;
    }
  }

  _getlocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    this.#workouts = data;
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }

  reset() {
    localStorage.removeItem('workouts');
  }
}

const app = new App();
