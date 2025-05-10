import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let xScale, yScale;

async function loadData() {
    const data = await d3.csv('loc.csv', (row) => ({
      ...row,
      line: Number(row.line), // or just +row.line
      depth: Number(row.depth),
      length: Number(row.length),
      date: new Date(row.date + 'T00:00' + row.timezone),
      datetime: new Date(row.datetime),
    }));
  
    return data;
  }

  function processCommits(data) {
    return d3
      .groups(data, (d) => d.commit)
      .map(([commit, lines]) => {
        let first = lines[0];
        let { author, date, time, timezone, datetime } = first;
        let ret = {
          id: commit,
          url: 'https://github.com/vis-society/lab-7/commit/' + commit,
          author,
          date,
          time,
          timezone,
          datetime,
          hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
          totalLines: lines.length,
        };
  
        Object.defineProperty(ret, 'lines', {
          value: lines,
          enumerable: false,
          writable: false,
          configurable: false,
        });
  
        return ret;
      });
  }
  
  function renderCommitInfo(data, commits) {
    // Create the dl element
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');
  
    // Add total LOC
    dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
    dl.append('dd').text(data.length);
  
    // Add total commits
    dl.append('dt').text('Total commits');
    dl.append('dd').text(commits.length);
  
    // Add number of files
    dl.append('dt').text('Number of files');
    dl.append('dd').text(d3.groups(data, (d) => d.file).length);

    // Add day of work most done
    dl.append('dt').text('Day of the week that most work is done');
    
    const dayOfWeekCounts = d3.rollup(
        data,
        (lines) => lines.length,
        (d) => d3.timeFormat('%A')(d.datetime) // Format datetime to get the day name
    );

    // Find the day with the most LOC
    const mostDoneDay = Array.from(dayOfWeekCounts).reduce((max, curr) => {
        return curr[1] > max[1] ? curr : max;
    }, ['', 0]);

    // Display the day with the most LOC
    dl.append('dd').text(`${mostDoneDay[0]}`);

    }
  
 function renderScatterPlot(data, commits) {
    const width = 1000;
    const height = 600;

    const margin = { top: 10, right: 10, bottom: 30, left: 20 };

    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };

    const svg = d3
        .select('#chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible');

    // Define scales
    xScale = d3
        .scaleTime()
        .domain(d3.extent(commits, (d) => d.datetime))
        .range([usableArea.left, usableArea.right])
        .nice();

    yScale = d3
        .scaleLinear()
        .domain([0, 24])
        .range([usableArea.bottom, usableArea.top]);

    // Color scale: midnight (0h) & 24h → deep blue, dawn/dusk transitions, midday → orange
    const timeColor = d3
        .scaleLinear()
        .domain([0, 6, 18, 24])
        .range(['#003366', '#FFBB33', '#FFBB33', '#003366'])
        .clamp(true);

    // Create gridlines group
    const grid = svg
        .append('g')
        .attr('class', 'gridlines')
        .attr('transform', `translate(${usableArea.left},0)`)
        .call(
            d3.axisLeft(yScale)
                .tickFormat('')
                .tickSize(-usableArea.width)
        );

    // Remove the default domain line
    grid.selectAll('.domain').remove();

    // Soften the tick lines
    grid.selectAll('line')
        .attr('stroke', '#ccc')
        .attr('stroke-width', 1)
        .attr('stroke-opacity', 0.7);

    // Add X axis
    svg.append('g')
        .attr('transform', `translate(0,${usableArea.bottom})`)
        .call(d3.axisBottom(xScale));

    // Add Y axis
    svg.append('g')
        .attr('transform', `translate(${usableArea.left},0)`)
        .call(
            d3.axisLeft(yScale)
                .ticks(24)
                .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00')
        );

    // Render dots after axes and gridlines
    const dots = svg.append('g').attr('class', 'dots');

    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
    const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]); // adjust these values based on your experimentation
    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

    dots
    .selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .style('fill-opacity', 0.7) // Add transparency for overlapping dots
    .on('mouseenter', (event, commit) => {
        d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
        renderTooltipContent(commit);
        updateTooltipVisibility(true);
        updateTooltipPosition(event);
    })
        .on('mouseleave', (event) => {
        d3.select(event.currentTarget).style('fill-opacity', 0.7);
        updateTooltipVisibility(false);
    });


}
    
    function renderTooltipContent(commit) {
        const link = document.getElementById('commit-link');
        const date = document.getElementById('commit-date');
      
        if (Object.keys(commit).length === 0) return;
      
        link.href = commit.url;
        link.textContent = commit.id;
        date.textContent = commit.datetime?.toLocaleString('en', {
          dateStyle: 'full',
        });
      }
      
      function updateTooltipVisibility(isVisible) {
        const tooltip = document.getElementById('commit-tooltip');
        tooltip.hidden = !isVisible;
      }
      
      function updateTooltipPosition(event) {
        const tooltip = document.getElementById('commit-tooltip');
        tooltip.style.left = `${event.clientX}px`;
        tooltip.style.top = `${event.clientY}px`;
      }

      function createBrushSelector(svg) {
        const brush = d3.brush()
        .on("start brush end", brushed);
      svg.call(brush);
      svg.selectAll(".dots, .overlay ~ *").raise();
}

function brushed(event) {
    const selection = event.selection;
    d3.selectAll('circle').classed('selected', (d) =>
      isCommitSelected(selection, d),
    );
    renderSelectionCount(selection);
    renderLanguageBreakdown(selection);
  }
  

function isCommitSelected(selection, commit) {
  if (!selection) {
    return false;
  }
  const [x0, x1] = selection.map((d) => d[0]);
  const [y0, y1] = selection.map((d) => d[1]);
  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);
  return x >= x0 && x <= x1 && y >= y0 && y <= y1;

  // TODO: return true if commit is within brushSelection
  // and false if not
}

function renderSelectionCount(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];

  const countElement = document.querySelector("#selection-count");
  countElement.textContent = `${
    selectedCommits.length || "No"
  } commits selected`;

  return selectedCommits;
}

function renderLanguageBreakdown(selection) {
    const selectedCommits = selection
      ? commits.filter((d) => isCommitSelected(selection, d))
      : [];
    const container = document.getElementById('language-breakdown');
  
    if (selectedCommits.length === 0) {
      container.innerHTML = '';
      return;
    }
    const requiredCommits = selectedCommits.length ? selectedCommits : commits;
    const lines = requiredCommits.flatMap((d) => d.lines);
  
    // Use d3.rollup to count lines per language
    const breakdown = d3.rollup(
      lines,
      (v) => v.length,
      (d) => d.type,
    );
  
    // Update DOM with breakdown
    container.innerHTML = '';
  
    for (const [language, count] of breakdown) {
      const proportion = count / lines.length;
      const formatted = d3.format('.1~%')(proportion);
  
      container.innerHTML += `
              <dt>${language}</dt>
              <dd>${count} lines (${formatted})</dd>
          `;
    }
  }
  
   
let data = await loadData();
let commits = processCommits(data);

renderCommitInfo(data, commits);
renderScatterPlot(data, commits);
const thesvg = d3.select("#chart").select("svg");
createBrushSelector(thesvg);
thesvg.call(d3.brush().on("start brush end", brushed));
