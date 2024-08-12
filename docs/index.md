```js
import {treeChart} from "./components/tree.js"
import { tidy, map, addRows, tally, filter, select, mutate, leftJoin,
        arrange, desc, distinct, rename, count, sum, max, groupBy, 
        mutateWithSummary,pivotLonger, pivotWider, summarize, sliceHead} from '@tidyjs/tidy'
```

# Quote Chain Explorer

### Select part

```js
const search = view(Inputs.select(
    ['afpfr-covid','confinement','vaccin', 'masque', 'raoult-chroloquine', 'municipales'], 
    {label: "Part Name", value: 'covid'})
)
```

Selected part summary and metadata:
 - `Nb trees`: ${dataHierarchy.slice(1).length}
 - `Nb unique ur-users`: ${_.uniq(dataHierarchy.slice(1).map(d => d.user)).length}
 - `Selected ur-user`: ${metadata.screen_name}
 - `Topic`: ${metadata.topic}
 - `Cut-off total number (unique) user`: ${metadata.cut_off_nb_user}
 - `Language ur-user(s)`: ${metadata.lang}


### Exploring selected part

The following functions work for the part that is currently selected. If you don't know what you are looking for, we can either filter by **user**:


```js
const x = tidy(dataHierarchy.slice(1), 
                 mutate({user_lower: d => d.user.toLowerCase()}),
                 arrange('user_lower'),
                 distinct('user'))
```

```js
const user_name = view(Inputs.select(x.map(d => d.user), { label: 'User name' }))
```

```js
Inputs.table(tidy(
  dataHierarchy.slice(1), 
  select(['id', 'user', 'followers_count', 'friends_count', 'depth', 'total_users']),
  filter((d) => d.user === user_name),
  mutate({ratio_UserDepth: d => d.total_users / d.depth }),
  rename({ followers_count: '#followers', friends_count: '#friends' })
))
```

or according to **size**:

<div>
${resize((width => Plot.plot({
        width,
        height: 150,
        nice:true,
        marks: [
            Plot.frame(), 
            Plot.rectY(query_table, Plot.binX({y: "count"}, {
              x: "tot_users", fill: "midnightblue", fillOpacity: 0.5, thresholds: 80
              })),
            (index, scales, channels, dimensions, context) => {
                const x1 = dimensions.marginLeft;
            const x2 = dimensions.width - dimensions.marginRight;
            const y1 = 0;
            const y2 = dimensions.height;
            const brushed = (event) => setStartEndUsers(event.selection?.map(scales.x.invert));
            const brush = d3.brushX().extent([[x1, y1], [x2, y2]]).on("brush end", brushed);
            return d3.create("svg:g").call(brush).node();
            }
    ]
    })))}
</div>

or according to **depth**:

<div>
${resize((width => Plot.plot({
        width,
        height: 150,
        nice:true,
        marks: [
            Plot.frame(), 
            Plot.rectY(query_table, Plot.binX({y: "count"}, {
              x: "depth", fill: "midnightblue", fillOpacity: 0.5
              })),
            (index, scales, channels, dimensions, context) => {
                const x1 = dimensions.marginLeft;
            const x2 = dimensions.width - dimensions.marginRight;
            const y1 = 0;
            const y2 = dimensions.height;
            const brushed = (event) => setStartEndDepth(event.selection?.map(scales.x.invert));
            const brush = d3.brushX().extent([[x1, y1], [x2, y2]]).on("brush end", brushed);
            return d3.create("svg:g").call(brush).node();
            }
    ]
    })))}
</div>

or according to **date**:

<div>
${resize((width => Plot.plot({
        width,
        height: 150,
        marginBottom: 40,
        marks: [
            Plot.frame(), 
            Plot.rectY(query_table, Plot.binX({y: "count"}, {
              x: "created_at", fill: "midnightblue", fillOpacity: 0.5, thresholds: 80
              })),
            (index, scales, channels, dimensions, context) => {
                const x1 = dimensions.marginLeft;
            const x2 = dimensions.width - dimensions.marginRight;
            const y1 = 0;
            const y2 = dimensions.height;
            const brushed = (event) => setStartEndDate(event.selection?.map(scales.x.invert));
            const brush = d3.brushX().extent([[x1, y1], [x2, y2]]).on("brush end", brushed);
            return d3.create("svg:g").call(brush).node();
            }
    ]
    })))}
</div>


```js
// Brush filter stuff
const minmaxUsers = d3.extent(query_table, d=>d.tot_users)
const minmaxDepth = d3.extent(query_table, d=>d.depth)
const minmaxDate = d3.extent(query_table, d=>d.created_at)
```

```js
const tot_users = Mutable(minmaxUsers);
const setStartEndUsers = (se) => tot_users.value = se;

const v_depth = Mutable(minmaxDepth);
const setStartEndDepth = (se) => v_depth.value = se;

const v_date = Mutable(minmaxDate);
const setStartEndDate = (se) => v_date.value = se;

```

```js
const filtered_table = tidy(query_table,
        filter((d) => tot_users === undefined ? 
            d.tot_users >= minmaxUsers[0] && d.tot_users <= minmaxUsers[1]: 
            d.tot_users >= tot_users[0] && d.tot_users <= tot_users[1]),
        filter((d) => v_depth === undefined ? 
            d.depth >= minmaxDepth[0] && d.depth <= minmaxDepth[1] :
            d.depth >= v_depth[0] && d.depth <= v_depth[1]),
        filter((d) => v_date === undefined ? 
             d.created_at >= minmaxDate[0] && d.created_at <= minmaxDate[1] : 
             d.created_at >= v_date[0] && d.created_at <= v_date[1])

)
```

```js
Inputs.table(filtered_table)
```

If we just want a random tree id, here is a random tree id generator (selected among the above filtering criteria):

```js
const button = view(Inputs.button("Generate rdm tree id", {}))
```

```js
button ?  filtered_table.map(d => d.id)[Math.floor(Math.random() * filtered_table.length)] : ""
```

Then, we can use that information to select a tree (copy-paste id from above):

```js
const tree_id = view(Inputs.text({ label: 'Tree id', value: tidy(dataHierarchy, arrange(desc("total_users"))).map(d => d.id)[0]}))
```

```js
function binChart() {

    const z = d3.scaleThreshold()
          .domain([-1/3, 1/3])   // 2 thresholds
          .range(["#2f719c", "#495057", "#9b2226"]); // 3 colors

    const d = codebook_sel.filter(d => d.BIPE_est !== "Nan")

    return Plot.plot({
        width, height: 200, marginLeft: 150, 
        y: { percent: true }, x: { domain: [-3, 3] },
        color: {
            type: "categorical", 
            domain: ["#2f719c", "#9b2226", "black"],
            range: ["#2f719c", "#9b2226", "black"], 
            // legend: true 
        },
        marks: [
            Plot.rectY(
            d, 
            Plot.binX({y2: "proportion"}, {x: "BIPE_est", thresholds: nb_bins, fill: d => z(d.BIPE_est)})),
            Plot.ruleY([0])
        ]
        })
}
```
```js
const binsInputs = Inputs.range([0, 100], {label: "Adjust bins", value: 30, step: 1})
const nb_bins = Generators.input(binsInputs);
```

<p>There are <span style="font-weight:bold;color:#2f719c">${filtered_table.filter(d=>d.id===tree_id).map(d=>d.blue)} blue </span>, <span style="font-weight:bold;color:#9b2226">${filtered_table.filter(d=>d.id===tree_id).map(d=>d.red)} red </span>, and <span style="font-weight:bold">${filtered_table.filter(d=>d.id===tree_id).map(d=>d.black)} black</span> tweets in this tree, distributed as follows:</p>

<div class="card">
    ${binsInputs}
    ${resize(width => binChart())}
</div>
<div>
    ${resize(width => treeChart(data, {width}))}
</div>
<div class="card" style="padding:0;">
    ${resize(width => Inputs.table(codebook_sel))}
</div>

```js
function globalIPE() {
  const z = d3.scaleThreshold()
          .domain([-1/3, 1/3])   // 2 thresholds
          .range(["#2f719c", "#495057", "#9b2226"]); // 3 colors
  const d = tidy(codebook, filter(d => d.BIPE_est !== ""), distinct("user_name"))
  return Plot.plot({
    title: "Global IPE distribution",
    width, height: 300, marginLeft: 150,
    y: { percent: true }, x: { domain: [-3, 3] },
    color: {
      legend: true,
      type: "categorical", 
      domain: ["left", "right", "center"],
      range: ["#2f719c", "#9b2226", "#495057x`"], 
    },
    marks: [
      Plot.rectY(
        d, 
        Plot.binX({y2: "proportion"}, {x: d => +d.BIPE_est, thresholds: 80, fill: d => z(d.BIPE_est)})),
      Plot.ruleY([0])
    ]
  })
}
```

```js
globalIPE()
```

Some Global stats:
 - Global range: (${d3.min(codebook.map(d=>+d.BIPE_est))}, ${d3.max(codebook.map(d=>+d.BIPE_est))})
 - mean: ${d3.mean(codebook.map(d => +d.BIPE_est))}
 - standard dev: ${d3.deviation(codebook.map(d=>+d.BIPE_est))}

```
p.s. Color scale is thresholded at the following points:
Dark Blue = (inf,-1/3)
Black = [-1/3, 1/3]
Red = (1/3, inf) 
```

```js
function readData(search) {
    switch (search) {
      case 'afpfr-covid': {
        return FileAttachment("data/quotes-2020_afpfr_covid@22.jsonl").json();
      }
      case 'confinement': {
        return FileAttachment("data/quotes-2020_confinement@20.jsonl").json();
      }
      case 'vaccin': {
        return FileAttachment("data/quotes-2020_vaccin@7.jsonl").json();
      }
      case 'masque': {
        return FileAttachment("data/quotes-2020_masques@2.jsonl").json();
      }
      case 'raoult-chroloquine': {
        return FileAttachment("data/quotes-2020_raoult@2.jsonl").json();
      }
      case 'municipales': {
        return FileAttachment("data/quotes-2020_municipales@2.jsonl").json();
      }
    }
}
```

```js
const dataHierarchy = readData(search) 
```

```js
const dataHierarchy_filtered = tidy(
  dataHierarchy.slice(1), // first row is metadata 
  filter((d) => d.id === tree_id)
)[0]
```

```js
const data = hierarchyToJson(dataHierarchy_filtered)
```

```js
function hierarchyToJson(root) {
  const obj = { name: root.id , text: root.text, user: root.user, 
               friends_count: root.friends_count, IPE_est: root.IPE_est, 
               followers_count: root.followers_count, pruned: false};
  if (root.quotes) obj.children = root.quotes.map(hierarchyToJson);
  if (root.data && root.data.value) obj.value = root.data.value;
  return obj;
}
```

```js
const metadata = dataHierarchy.slice(0,1)[0]
```


```js
function readCodebook(search) {
    switch (search) {
      case 'confinement': {
        return FileAttachment("data/confinement_codebook@7.csv").csv({autotyped:true});
      }
      case 'vaccin': {
        return FileAttachment("data/vaccin_codebook@5.csv").csv({autotyped:true});
      }
      case 'afpfr-covid': {
        return FileAttachment("data/afpfr_covid_codebook@9.csv").csv({autotyped:true});
      }
      case 'masque': {
        return FileAttachment("data/masques_codebook@2.csv").csv({autotyped:true});
      }
      case 'raoult-chroloquine': {
        return FileAttachment("data/raoult_codebook@2.csv").csv({autotyped:true});
      }
      case 'municipales': {
        return FileAttachment("data/municipales_codebook@2.csv").csv({autotyped:true});
      }
    }
}
```

```js
const codebook = readCodebook(search)
```

```js
const list_tree_ids = tidy(codebook, distinct('tree_id')).map(d => d.tree_id)
```


```js
const selected_tree = tidy(
    codebook, 
    filter(d => d.tweet_id == tree_id)
  ).map(d => d.tree_id)[0]
```

```js
const codebook_sel =  tidy(
    codebook, 
    filter(d => d.tree_id == selected_tree ),
    mutate({followers_count: d => +d.followers_count,
            tweet_url: d => "https://twitter.com/@"+d.user_name+"/status/"+d.tweet_id,
            BIPE_est: d => d.BIPE_est.length === 0 ? "Nan" : +d.BIPE_est}))
```

```js
function count_ideo() {
  const out = [];
  
  for (let i = 0; i < list_tree_ids.length; ++i) {
    const tree_i = tidy(
      codebook, 
      filter(d =>d.tree_id === list_tree_ids[i]),  
      mutate({BIPE_est: d => d.BIPE_est.length === 0 ? "Nan" : +d.BIPE_est})                  
    )

    let blue = 0
    let red = 0
    let black = 0 
    
    const thresh  = 1/3
    for (let j = 0; j < tree_i.length; j++) {
      if (tree_i[j].BIPE_est < -thresh) { 
        blue += 1 ;
      } else if (tree_i[j].BIPE_est <= thresh) {
        black += 1; 
      } else if (tree_i[j].BIPE_est > thresh) { 
        red += 1 ;
      }
    }
    out.push({'tree_id':list_tree_ids[i], 'black':black, 'blue':blue, 'red':red})
  }
  return out
}
```

```js
const parser = d3.timeParse("%a %b %d %H:%M:%S +0000 %Y")
```
```js
const thresh_date = new Date("2019-01-01")
```

```js
const query_table = tidy(
    codebook,
    filter(d => d.BIPE_est != ""),
    groupBy("tree_id", [
             mutateWithSummary({ 
               count_users: count('tree_id'), 
               tot_users: d => d[0].count_users["n"], //zero-based index
               depth: max("depth")
      }) ]),
    distinct("tree_id"),
    leftJoin(count_ideo(), {by: 'tree_id'}),
    select(['tweet_id', 'user_name', 'followers_count', 'friends_count', 
            'depth', "tot_users", "created_at", 'black', 'blue', 'red']),
    rename({tweet_id:"id"}),
    mutate({ratio_UserDepth: d => d.tot_users/d.depth , 
            created_at: d => parser(d.created_at),
            depth: d=> +d.depth}),
    filter(
      // (d) => d.depth >= 1 && d.tot_users > 5 && 
      d => d.created_at > thresh_date),
    rename({ followers_count: '#followers' }),
)
```

```js
const mean_codebook_global = d3.mean(codebook.map(d => +d.BIPE_est))
```