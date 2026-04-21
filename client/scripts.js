let state = {
  theatreList: [],
  showtimes: [],
  filters: {
    movie: [],
    genre: [],
    attribute: []
  }
}

// hit backend for theatre data
const getTheatres = async () => {
  try {
    const res = await fetch("/api/getTheatres");
    if (!res.ok) {
      throw new Error(`Response Status: ${res.status}`)
    }

    const data = await res.json();
    const { theatres } = data._embedded;
    state.theatreList = [...theatres];
    populateTheatreList(theatres);

    const input = document.querySelector("input[name='theatre-search']");
    input.addEventListener("input", (e) => {
      const { target } = e;
      if (target.value.length > 0) {
        filterTheatres(target.value.replace(" ", "-"));
      } else {
        populateTheatreList(state.theatreList);
      }
    })

    const inputs = document.querySelectorAll(".filters input");
    for (const input of inputs) {
      input.addEventListener("input", (e) => {
        const { target } = e;
        if (target.value.length > 0) {
          filterType(target.getAttribute("name"), target.value);
        } else {
          repopulateFilter(target.getAttribute("name"));
        }
      })
    }
  } catch (err) {
    console.error(err.message);
  }
}

// hit backend for showtimes based on selected theatre
const getShowtimes = async (id) => {
  try {
    const res = await fetch(`/api/getShowtimes?id=${id}`)
    if (!res.ok) {
      throw new Error(`Response Status: ${res.status}`);
    }

    const data = await res.json();
    const { showtimes } = data._embedded;
    state.showtimes = showtimes;
    populateFilters(showtimes);
    buildCalendar(showtimes);
  } catch (err) {
    console.error(err.message)
  }
}

const populateFilters = (showtimes) => {
  // clear filter before populating
  state.filters = {
    attribute: [],
    movie: [],
    genre: []
  };

  // update state with filter info
  for (const showtime of showtimes) {
    const { attributes, genre, movieName, movieId } = showtime;
    for (const attribute of attributes) {
      const { name } = attribute;
      if (!state.filters.attribute.includes(name)) {
        state.filters.attribute.push(name);
      }
    }
    if (!state.filters.genre.includes(genre)) {
      state.filters.genre.push(genre);
    }
    if (!state.filters.movie.includes(movieName)) {
      state.filters.movie.push(movieName);
    }
  }

  // populate filter fields
  for (const key in state.filters) {
    const target = document.querySelector(`.${key}.list`);
    target.replaceChildren();
    const ul = document.createElement("ul");
    for (const filter of state.filters[key]) {
      const li = document.createElement("li");
      li.textContent = filter;
      li.addEventListener("click", (e) => {
        const input = document.querySelector(`input[name=${key}]`);
        input.value = filter;
        filterShowtimes();
      })
      ul.append(li);
    }
    target.append(ul);
  }

  const filters = document.querySelector(".filters");
  filters.style.display = "flex";
}

const buildCalendar = (showtimes) => {
  state.calendar = {};
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayLong = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  // parse the entire fucking json and organize the data
  for (const showtime of showtimes) {
    const date = new Date(showtime.showDateTimeLocal);
    const month = date.getMonth();
    const day = date.getDate();

    if (state.calendar[month]) {
      if (state.calendar[month][day]) {
        state.calendar[month][day].push(showtime);
      } else {
        state.calendar[month][day] = [showtime];
      }
    } else {
      state.calendar[month] = {
        [day]: [showtime]
      }
    }
  }

  // build the calendar
  const target = document.querySelector(".showtimes-calendar");

  // clear calendar since we're replacing it
  target.replaceChildren();

  // loop through the calendar
  for (const key in state.calendar) {
    // container
    const container = document.createElement("div");
    container.classList.add("container");

    // build month
    const monthEl = document.createElement("div");
    monthEl.classList.add("month")
    monthEl.textContent = monthNames[key];
    container.append(monthEl);

    // build labels
    const label = document.createElement("div");
    label.classList.add("dateLabels");
    for (let i = 0; i < dayLong.length; i++) {
      const labelDate = document.createElement("div");
      labelDate.textContent = dayLong[i];
      label.append(labelDate);
    }
    container.append(label);

    // build days
    const dates = document.createElement("div");
    dates.classList.add("dates");
    const days = Object.entries(state.calendar[key]);
    for (const [i, [d, showtimes]] of days.entries()) {
      const date = new Date(`${monthNames[key]} ${d} 2026`);
      const day = date.getDay();

      // if current day of week is not sunday, build the prior day slots
      if (i === 0 && day > 0) {
        for (let j = 0; j < day; j++) {
          // create blank slots
          const div = document.createElement("div");
          dates.append(div);
        }
      }


      // now build the current date and onwards
      const div = document.createElement("div");
      const span = document.createElement("span");
      span.classList.add("date");
      span.textContent = d;
      div.append(span);

      // check the date compared to previous date
      if (i > 0) {
        const [prevDay] = days[i - 1];
        const diff = d - prevDay;
        if (diff > 1) {
          for (let z = 1; z < diff; z++) {
            // create blank slots
            const div = document.createElement("div");
            const span = document.createElement("span");
            span.classList.add("date", "noshow")
            span.textContent = parseInt(prevDay) + parseInt(z);
            div.append(span);
            dates.append(div);
          }
        }
      }

      // do something with the showtimes here
      const movies = {};

      // sort showtimes by movie names
      for (const showtime of showtimes) {
        const { movieName: name } = showtime;
        if (movies[name]) {
          movies[name].push(showtime);
        } else {
          movies[name] = [showtime];
        }
      }

      // loop through the movies and generate the list
      const div1 = document.createElement("div");
      div1.classList.add("showtimes");
      for (const key in movies) {
        const div2 = document.createElement("div");
        div2.classList.add("showtime");
        div2.textContent = key;
        div2.title = key;
        div2.addEventListener("click", () => showtimeDetails(movies[key], key));
        div1.append(div2);
      }
      div.append(div1);
      dates.append(div);

      // fill the remaining slots
      if (i === Object.keys(state.calendar[key]).length - 1) {
        for (let j = day; j < 6; j++) {
          const div = document.createElement("div");
          dates.append(div);
        }
      }
    }
    container.append(dates)
    target.append(container);
  }
}

const populateTheatreList = (theatreList) => {
  const list = document.querySelector(".theatre-list");
  list.replaceChildren();
  const ul = document.createElement("ul");
  for (const theater of theatreList) {
    const li = document.createElement("li");
    li.innerText = theater.name;
    li.addEventListener("click", (e) => {
      const input = document.querySelector("input[name='theatre-search']");
      input.value = theater.name;
      getShowtimes(theater.id);
    })
    ul.append(li);
  }
  // add click events to all the list items
  const listItems = document.querySelectorAll(".theatre-list ul li");
  for (const listItem of listItems) {
    listItem.addEventListener("click", (e) => {
      console.log("test");
    })

  }
  list.append(ul);
}

const filterTheatres = (str) => {
  const filter = state.theatreList.filter(theatre => {
    const stringJSON = JSON.stringify(theatre);
    if (stringJSON.includes(str)) {
      return theatre;
    }
  })
  populateTheatreList(filter);
}

const filterShowtimes = () => {
  const inputs = document.querySelectorAll(".filter input");
  let filter = state.showtimes;
  for (const input of inputs) {
    if (input.value.length > 0) {
      filter = filter.filter(showtime => {
        const stringJSON = JSON.stringify(showtime).toLowerCase();
        if (stringJSON.includes(input.value.toLowerCase())) {
          return showtime;
        }
      })
    }
  }
  populateFilters(filter);
  buildCalendar(filter);
}

const filterType = (type, str) => {
  const target = document.querySelector(`.${type}`);
  target.replaceChildren();
  const filters = state.filters[type].filter(filter => {
    if (filter.toLowerCase().includes(str.toLowerCase()) || !str) {
      return filter;
    }
  })
  const ul = document.createElement("ul");
  for (const filter of filters) {
    const li = document.createElement("li");
    li.textContent = filter;
    li.addEventListener("click", (e) => {
      const input = document.querySelector(`input[name=${type}]`);
      input.value = filter;
      filterShowtimes();
    })
    ul.append(li);
  }
  target.append(ul);
}

const repopulateFilter = (key) => {
  // update state with filter info
  for (const showtime of state.showtimes) {
    const { attributes, genre, movieName, movieId } = showtime;
    switch (key) {
      case 'attribute':
        for (const attribute of attributes) {
          const { name } = attribute;
          if (!state.filters.attribute.includes(name)) {
            state.filters.attribute.push(name);
          }
        }
        break;
      case 'movie':
        if (!state.filters.movie.includes(movieName)) {
          state.filters.movie.push(movieName);
        }
        break;
      case 'genre':
        if (!state.filters.genre.includes(genre)) {
          state.filters.genre.push(genre);
        }
        break;
    }
  }

  // populate filter fields
  const target = document.querySelector(`.${key}.list`);
  target.replaceChildren();
  const ul = document.createElement("ul");
  for (const filter of state.filters[key]) {
    const li = document.createElement("li");
    li.textContent = filter;
    li.addEventListener("click", (e) => {
      const input = document.querySelector(`input[name=${key}]`);
      input.value = filter;
      filterShowtimes();
    })
    ul.append(li);
  }
  target.append(ul);
  filterShowtimes();
}

const showtimeDetails = (showtimes, name) => {
  // create the popup
  const backdrop = document.createElement("div");
  backdrop.classList.add("popup-backdrop");
  backdrop.addEventListener("click", (e) => backdrop.remove())
  const container = document.createElement("div");
  container.classList.add("popup-container");

  // close button
  const exit = document.createElement("div");
  exit.textContent = "x";
  exit.classList.add("exit");
  exit.addEventListener("click", (e) => backdrop.remove())
  container.append(exit);

  // build the info
  const title = document.createElement("div");
  title.classList.add("title");
  title.textContent = `Title: ${name}`;
  container.append(title)

  // create the showtime list
  const p = document.createElement("p");
  p.classList.add("showtimes");
  p.textContent = "Showtimes";
  container.append(p);
  const ul = document.createElement("ul");

  // loop showtimes
  for (const showtime of showtimes) {
    // details we want...
    const { showDateTimeLocal, attributes } = showtime;
    const time = new Date(showDateTimeLocal).toLocaleTimeString();

    const li = document.createElement("li");
    li.textContent = `${time} >`;

    const div = document.createElement("div");
    div.classList.add("attributes");
    for (const attr of attributes) {
      const span = document.createElement("span");
      span.textContent = attr.name;
      div.append(span)
    }
    li.append(div);
    ul.append(li);
  }
  container.append(ul)
  backdrop.append(container)
  document.body.append(backdrop);
}

getTheatres();