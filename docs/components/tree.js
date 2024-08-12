import * as d3 from "npm:d3";

function tree_horizontal(data, {width}) {
    const root = d3.hierarchy(data).sort((a, b) => d3.ascending(a.data.IPE_est, b.data.IPE_est));
    root.dx = 20;
    root.dy = width / (root.height + 2);
    return d3.tree().nodeSize([root.dx, root.dy])(root);
}




export function treeChart(data, { width}) {
    const followers_r = d3.scaleLog().base(10).domain([1, 10]);
    
    const z = d3.scaleThreshold()
          .domain([-1/3, 1/3])   // 2 thresholds
          .range(["#2f719c", "#495057", "#9b2226"]); // 3 colors

    const root = tree_horizontal(data, {width});
    const root_user = root.data.user
    
    const linkWidth = d3
      .scaleLinear()
      .domain([root.height, 0])
      .range([1, 5]);
    
    let x0 = Infinity;
    let x1 = -x0;
    root.each(d => {
      if (d.x > x1) x1 = d.x;
      if (d.x < x0) x0 = d.x;
    });
  
    const svg = d3.create("svg")
        .attr("viewBox", [0, 0, width, x1 - x0 + root.dx * 2]);
    // .attr("viewBox", [0, 0, width + 400, 2050]);  // top to bottom layout
    
    
    const g = svg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        // .attr("transform", `translate(${root.dy + 550}, ${root.dx + 50})`); // top to bottom layout
        .attr("transform", `translate(${root.dy / 1.2},${root.dx - x0})`);
      
    const linksGroup = g.append("g")
        .attr("fill", "none")
        .attr("stroke", "#555")
        .attr("stroke-width", 1.5)
      .selectAll("path")
      .data(root.links())
      .join("g");
    
    const links = linksGroup
        .append("path")
    .join("path")
      .attr("d", d3.linkHorizontal()
          .x(d => d.y)    // left-to-right layout
          .y(d => d.x))
          // .x(d => d.x)   // top to bottom layout
          // .y(d => d.y))
        .attr("stroke-opacity",  d => (!d.target.data.IPE_est) ? 0.2 : 1)
        .attr("stroke", d => (!d.target.data.IPE_est) ? "black" : z(d.target.data.IPE_est));
    
    const node = g.append("g")
        .attr("stroke-linejoin", "round")
        .attr("stroke-width", 3)
      .selectAll("g")
      .data(root.descendants())
      .join("g")
        .attr("transform", d => `translate(${d.y},${d.x})`);
       // .attr("transform", d => `translate(${d.x},${d.y})`); // top to bottom layout
  
      node.append("circle")
        .attr("stroke", "#000000")
        .attr("stroke-width", 0.3)
        .attr("r", d => followers_r(d.data.followers_count))
        .attr("fill", d => (d.data.IPE_est || d.data.user === root_user) ? z(d.data.IPE_est) : "black" )
        .attr("opacity",  d => (d.data.IPE_est || d.data.user == root_user) ? 1 : 0.2);
  
      node.append("title")
          .text(d => `tweet_id: ${d.data.name}`)
          .append("title")
          .text(d => (d.data.IPE_est || d.data.user === root_user) ? `\nIPE: ${d.data.IPE_est}` : "\nIPE: None")
          .append("title")
          .text(d => `\n #Followers: ${d.data.followers_count} `)
          .append("title")
          .text(d => `\nTweet: ${d.data.text}`);
  
     node.append("text")
        .attr("dy", "0.31em")
        .attr("x", d => d.children ? -6 : 6)
        .attr("dx", d => d.children ? "-0.31em" : "0.31em")
        .attr("opacity",  d => (d.data.IPE_est || d.data.user == root_user) ? 1 : 0.2)
        .attr("text-anchor", d => d.children ? "end" : "start")
        // .attr("transform", d => `rotate(45)`) // top top bottom layout
       .text(d => d.data.user)
      .clone(true).lower()
        .attr("stroke", "white");
      
      return svg.node()
       
  }