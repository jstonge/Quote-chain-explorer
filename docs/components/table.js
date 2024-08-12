import * as d3 from "npm:d3";

export function table(inputData, options = {}) {
    let { page, pageSize, date, title, debug } = {
      pageSize: 15,
      page: 0,
      date: "day",
      title: "",
      debug: false,
      ...options
    };
    let first = true;
    let searching = false;
    let filters = {};
    let searchQuery = "";
    let adata = Array.from(inputData); // Normalize iterables to plain arrays.
    let detectedColumns = detectColumns(adata);
    let supercontainer = html`<div class='table-2'></div>`;
  
    function render() {
      let data;
      if (Object.keys(filters).length || searchQuery) {
        data = adata.filter(obj => {
          for (let [col, value] of Object.entries(filters)) {
            if (obj[col] !== value) return false;
          }
          if (searchQuery) {
            let strValue = "";
            for (let key of Object.keys(obj)) {
              strValue += obj[key];
            }
            if (!strValue.toLowerCase().includes(searchQuery.toLowerCase())) {
              return false;
            }
          }
          return true;
        });
      } else {
        data = adata;
      }
      // If we're on page 5 and then filter and yield
      // fewer than 5 pages.
      if (page * pageSize > data.length) {
        page = Math.floor(data.length / pageSize);
      }
      let start = page * pageSize;
      let end = Math.min(data.length, (page + 1) * pageSize);
      let pageCount = pageSize ? Math.ceil(data.length / pageSize) : 0;
      let chunk = data.slice(start, end);
      let hasPrev = page > 0;
      let hasNext = end < data.length;
  
      let prevButton = html`<div title="Previous" class='button ${
        hasPrev ? "" : "disabled"
      }'>${leftIcon()}</div>`;
      let nextButton = html`<div title="Next" class='button ${
        hasNext ? "" : "disabled"
      }'>${rightIcon()}</div>`;
      prevButton.onclick = () => {
        page--;
        render();
      };
      nextButton.onclick = () => {
        page++;
        render();
      };
      let pageLinks = html`<div class='page-links'></div>`;
      if (pageCount < 5) {
        for (let i = 0; i < pageCount; i++) {
          let elem = html`<div class='${i === page ? "current" : ""}'>${i +
            1}</div>`;
          elem.onclick = () => {
            page = i;
            render();
          };
          pageLinks.appendChild(elem);
        }
      } else {
        const select = html`<div class='page-selector-container'><label for='page-selector'>Page</label> <select id='page-selector'>
      ${Array.from({ length: pageCount }, (_, i) => {
        let elem = html`<option value='${i}'>${i + 1}</option>`;
        return elem;
      })}
  </select></div>`;
        select.querySelector("select").value = page;
        pageLinks.appendChild(select);
        select.onchange = e => {
          page = parseInt(e.target.value, 10);
          render();
        };
      }
      let searchToggle = html`<div style='flex:auto;display:inline-flex;'><div title="Search / Filter" class='button'>${searchIcon()}</div></div>`;
      searchToggle.querySelector(".button").onclick = () => {
        searching = !searching;
        render();
      };
      let navigation = html`<div class='pager'>${searchToggle}
  <div class='title'>${title}</div>
            ${pageLinks}
            ${prevButton}
            ${nextButton}
          </div>`;
      let tbody = html`<tbody></tbody>`;
      let table = html`<table>${header(detectedColumns)}${tbody}</table>`;
      let searchUI = searching
        ? search(adata, detectedColumns, filters, searchQuery)
        : "";
      let container = html`<div>
  ${searchUI}
  ${
        hasNext || hasPrev ? navigation : ""
      }<div class='scroll-zone'>${table}</div>${style()}</div>`;
      for (let d of chunk) {
        tbody.appendChild(row(d, detectedColumns, { date }));
      }
  
      if (searchUI) {
        searchUI.addEventListener("setfilters", e => {
          ({ filters, searchQuery } = e.target.value);
          render();
        });
        searchUI.addEventListener("closefilters", e => {
          ({ filters, searchQuery } = e.target.value);
          searching = false;
          render();
        });
      }
  
      supercontainer.innerHTML = "";
      supercontainer.appendChild(container);
      supercontainer.value = chunk;
      supercontainer.value.data = data;
      supercontainer.dispatchEvent(new CustomEvent("input"));
  
      if (first) {
        setTimeout(() => {
          // If the table wants to be wide, let it be wide and scrollable.
          if (supercontainer.querySelector("table").scrollWidth > 640) {
            supercontainer.classList.add("wide");
          }
          if (recommendVerticalBorders(supercontainer)) {
            supercontainer.classList.add("narrow-columns");
          }
        }, 0);
        first = false;
      }
    }
    render();
    return supercontainer;
  }