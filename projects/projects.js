import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');

renderProjects(projects, projectsContainer, 'h2');

const projectsTitle = document.querySelector('.projects-title');
if (projectsTitle) {
    projectsTitle.textContent = `${projects.length} Projects`;
}

let selectedIndex = -1; // Initialize selectedIndex to -1 (no selection)

// Refactor all plotting into one function
function renderPieChart(projectsGiven) {
  
  let svg = d3.select('svg');
  svg.selectAll('path').remove();

  let legend = d3.select('.legend');
  legend.selectAll('li').remove();

  // Recalculate rolled data
  let newRolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year
  );

  // Recalculate data
  let newData = newRolledData.map(([year, count]) => {
    return { value: count, label: year };
  });

  // Recalculate slice generator, arc data, and arcs
  let newSliceGenerator = d3.pie().value((d) => d.value);
  let newArcData = newSliceGenerator(newData);

  const arcGenerator = d3.arc()
    .innerRadius(0)
    .outerRadius(50);

  let colors = d3.scaleOrdinal(d3.schemeTableau10);

  // Append the arcs to the SVG
  newArcData.forEach((arc, i) => {
    svg.append('path')
      .attr('d', arcGenerator(arc))
      .attr('fill', colors(i))
      .attr('class', i === selectedIndex ? 'selected' : '') // Apply 'selected' class if selected
      .on('click', () => {
        // Update selectedIndex
        selectedIndex = selectedIndex === i ? -1 : i;

        // Filter projects based on the selected year
        if (selectedIndex === -1) {
          // No selection, render all projects
          renderProjects(projects, projectsContainer, 'h2');
        } else {
          // Filter projects by the selected year
          const selectedYear = newData[selectedIndex].label;
          const filteredProjects = projects.filter(
            (project) => project.year === selectedYear
          );
          renderProjects(filteredProjects, projectsContainer, 'h2');
        }

        // Update the pie chart
        svg.selectAll('path')
          .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : ''));

        // Update the legend
        legend.selectAll('li')
          .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : ''));
      });
  });

  // Update the legend
  newData.forEach((d, i) => {
    legend.append('li')
      .attr('style', `--color:${colors(i)}`)
      .attr('class', i === selectedIndex ? 'selected' : '') // Apply 'selected' class if selected
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => {
        // Update selectedIndex
        selectedIndex = selectedIndex === i ? -1 : i;

        // Filter projects based on the selected year
        if (selectedIndex === -1) {
          // No selection, render all projects
          renderProjects(projects, projectsContainer, 'h2');
        } else {
          // Filter projects by the selected year
          const selectedYear = newData[selectedIndex].label;
          const filteredProjects = projects.filter(
            (project) => project.year === selectedYear
          );
          renderProjects(filteredProjects, projectsContainer, 'h2');
        }

        // Update the pie chart
        svg.selectAll('path')
          .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : ''));

        // Update the legend
        legend.selectAll('li')
          .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : ''));
      });
  });
}

// Call this function on page load
renderPieChart(projects);

let query = '';
let searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('input', (event) => {
  // Update query value
  query = event.target.value;

  // Filter projects
  let filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });

  // Re-render projects and pie chart
  renderProjects(filteredProjects, projectsContainer, 'h2');
  renderPieChart(filteredProjects);
});
