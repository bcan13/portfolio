console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

const BASE_PATH =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "/"
    : "/portfolio/";

let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'resume/', title: 'Resume' },
    { url: 'contact/', title: 'Contact' },
    { url: "https://github.com/bcan13", title: "Profile" },
    ];

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let page of pages) {
    let url = page.url;
    let title = page.title;

    url = !url.startsWith("http") ? BASE_PATH + url : url;

    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;

    if (a.host === location.host && a.pathname === location.pathname) {
        a.classList.add('current');
    }

    if (a.host !== location.host) {
        a.target = '_blank';
        a.rel = "noopener noreferrer";
    }

    nav.append(a);
}
    
document.body.insertAdjacentHTML(
    'afterbegin',
    `
      <label class="color-scheme">
          Theme:
          <select>
                <option value="light dark">Auto</option>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
          </select>
      </label>`,
  );
  
const select = document.querySelector('.color-scheme select');


if ("colorScheme" in localStorage) {
    const savedScheme = localStorage.colorScheme;
    document.documentElement.style.setProperty('color-scheme', savedScheme);
    select.value = savedScheme; // Update the dropdown to match
  }

select.addEventListener('input', function (event) {
  const scheme = event.target.value;
  console.log('color scheme changed to', scheme);
  document.documentElement.style.setProperty('color-scheme', scheme);
  localStorage.colorScheme = scheme;
});


  
