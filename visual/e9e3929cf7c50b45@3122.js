
async function _data(d3,FileAttachment){return(
d3.csvParse(await FileAttachment("category-brands.csv").text(), d3.autoType)
)}


function _replay(html){return(
html`<button>Replay`
)}

function _title(md){return(
md``
)}

async function* _chart(replay,d3,width,height,bars,axis,labels,ticker,keyframes,duration,x,invalidation)
{
  replay;

  const svg = d3.create("svg")
      .attr("viewBox", [0, 0, width, height]);

  const updateBars = bars(svg);
  const updateAxis = axis(svg);
  const updateLabels = labels(svg);
  const updateTicker = ticker(svg);

  yield svg.node();

  for (const keyframe of keyframes) {
    const transition = svg.transition()
        .duration(duration)
        .ease(d3.easeLinear);

    // Extract the top bar’s value.
    x.domain([0, keyframe[1][0].value]);

    updateAxis(keyframe, transition);
    updateBars(keyframe, transition);
    updateLabels(keyframe, transition);
    updateTicker(keyframe, transition);

    invalidation.then(() => svg.interrupt());
    await transition.end();
  }
}




function _duration(){return(
250
)}



function _14(data){return(
data
)}



function _16(d3,data){return(
d3.group(data, d => d.name)
)}


function _18(data){return(
data.filter(d => d.name === "Heineken")
)}

function _19(n,md){return(
md``
)}

function _n(){return(
12
)}

function _21(md){return(
md``
)}

function _names(data){return(
new Set(data.map(d => d.name))
)}

function _23(md){return(
md``
)}

function _datevalues(d3,data){return(
Array.from(d3.rollup(data, ([d]) => d.value, d => +d.date, d => d.name))
  .map(([date, data]) => [new Date(date), data])
  .sort(([a], [b]) => d3.ascending(a, b))
)}

function _25(md){return(
md``
)}

function _26(md){return(
md``
)}

function _rank(names,d3,n){return(
function rank(value) {
  const data = Array.from(names, name => ({name, value: value(name)}));
  data.sort((a, b) => d3.descending(a.value, b.value));
  for (let i = 0; i < data.length; ++i) data[i].rank = Math.min(n, i);
  return data;
}
)}

function _28(md){return(
md``
)}

function _29(rank,datevalues){return(
rank(name => datevalues[0][1].get(name))
)}

function _30(duration,k,md){return(
md``
)}

function _k(){return(
10
)}

function _32(tex,md){return(
md``
)}

function _keyframes(d3,datevalues,k,rank)
{
  const keyframes = [];
  let ka, a, kb, b;
  for ([[ka, a], [kb, b]] of d3.pairs(datevalues)) {
    for (let i = 0; i < k; ++i) {
      const t = i / k;
      keyframes.push([
        new Date(ka * (1 - t) + kb * t),
        rank(name => (a.get(name) || 0) * (1 - t) + (b.get(name) || 0) * t)
      ]);
    }
  }
  keyframes.push([new Date(kb), rank(name => b.get(name) || 0)]);
  return keyframes;
}


function _34(n,md){return(
md``
)}

function _nameframes(d3,keyframes){return(
d3.groups(keyframes.flatMap(([, data]) => data), d => d.name)
)}

function _prev(nameframes,d3){return(
new Map(nameframes.flatMap(([, data]) => d3.pairs(data, (a, b) => [b, a])))
)}

function _next(nameframes,d3){return(
new Map(nameframes.flatMap(([, data]) => d3.pairs(data)))
)}

function _38(md){return(
md``
)}

function _39(md){return(
md``
)}

function _bars(n,color,y,x,prev,next){return(
function bars(svg) {
  let bar = svg.append("g")
      .attr("fill-opacity", 0.6)
    .selectAll("rect");

  return ([date, data], transition) => bar = bar
    .data(data.slice(0, n), d => d.name)
    .join(
      enter => enter.append("rect")
        .attr("fill", color)
        .attr("height", y.bandwidth())
        .attr("x", x(0))
        .attr("y", d => y((prev.get(d) || d).rank))
        .attr("width", d => x((prev.get(d) || d).value) - x(0)),
      update => update,
      exit => exit.transition(transition).remove()
        .attr("y", d => y((next.get(d) || d).rank))
        .attr("width", d => x((next.get(d) || d).value) - x(0))
    )
    .call(bar => bar.transition(transition)
      .attr("y", d => y(d.rank))
      .attr("width", d => x(d.value) - x(0)));
}
)}

function _41(md){return(
md``
)}

function _42(md){return(
md``
)}

function _43(md){return(
md``
)}

function _44(md){return(
md``
)}

function _45(md){return(
md`## Labels

As you might expect, the labels are implemented similarly to the bars.`
)}

function _labels(n,x,prev,y,next,d3,formatNumber){return(
function labels(svg) {
  let label = svg.append("g")
      .style("font", "bold 12px var(--sans-serif)")
      .style("font-variant-numeric", "tabular-nums")
      .attr("text-anchor", "end")
    .selectAll("text");

  return ([date, data], transition) => label = label
    .data(data.slice(0, n), d => d.name)
    .join(
      enter => enter.append("text")
        .attr("transform", d => `translate(${x((prev.get(d) || d).value)},${y((prev.get(d) || d).rank)})`)
        .attr("y", y.bandwidth() / 2)
        .attr("x", -6)
        .attr("dy", "-0.25em")
        .text(d => d.name)
        .call(text => text.append("tspan")
          .attr("fill-opacity", 0.7)
          .attr("font-weight", "normal")
          .attr("x", -6)
          .attr("dy", "1.15em")),
      update => update,
      exit => exit.transition(transition).remove()
        .attr("transform", d => `translate(${x((next.get(d) || d).value)},${y((next.get(d) || d).rank)})`)
        .call(g => g.select("tspan")
                    .textTween((d) => d3.interpolateRound(d.value, (next.get(d) || d).value))
             )
    )
    .call(bar => bar.transition(transition)
      .attr("transform", d => `translate(${x(d.value)},${y(d.rank)})`)
      .call(g => g.select("tspan")
                  .textTween((d) => (t) => formatNumber(
                    d3.interpolateNumber((prev.get(d) || d).value, d.value)(t)
                  ))
           )
    )
}
)}

function _47(md){return(
md`There are two labels per bar: the name and the value; a TSPAN element is used for the latter. We set the *x* attribute of both elements so they are right-aligned, and use the *transform* attribute (and *y* and *dy*) to position text. (See the [SVG specification](https://www.w3.org/TR/SVG11/text.html#TextElement) for more on text elements.)`
)}

function _48(md){return(
md`To transition the text labels, we use D3’s [*transition*.textTween](https://d3js.org/d3-transition/modifying#transition_textTween).`
)}

function _49(md){return(
md`Since the value labels change sixty times per second, we use [tabular figures](https://practicaltypography.com/alternate-figures.html#tabular-and-proportional-figures) to reduce jitter and improve readability. Try commenting out the [font-variant-numeric](https://drafts.csswg.org/css-fonts-3/#propdef-font-variant-numeric) style above to see its effect!`
)}

function _50(md){return(
md`The function below is used to [format](https://d3js.org/d3-format) values as whole numbers. If you want decimal values, adjust accordingly.`
)}

function _formatNumber(d3){return(
d3.format(",d")
)}

function _52(md){return(
md`## Axis

Our *x*-axis is top-anchored and slightly customized.`
)}

function _axis(margin,d3,x,width,barSize,n,y){return(
function axis(svg) {
  const g = svg.append("g")
      .attr("transform", `translate(0,${margin.top})`);

  const axis = d3.axisTop(x)
      .ticks(width / 160)
      .tickSizeOuter(0)
      .tickSizeInner(-barSize * (n + y.padding()));

  return (_, transition) => {
    g.transition(transition).call(axis);
    g.select(".tick:first-of-type text").remove();
    g.selectAll(".tick:not(:first-of-type) line").attr("stroke", "white");
    g.select(".domain").remove();
  };
}
)}

function _54(md){return(
md`Not much to say here. We use D3’s [margin convention](/@d3/chart-template). The suggested tick count is derived from Observable’s responsive [*width*](https://github.com/observablehq/stdlib/blob/master/README.md#width), so it works on both small and large screens. The tick size is negative so that the tick lines overlay the bars. And we use [post-selection](https://observablehq.com/@d3/styled-axes)—modifying the elements generated by the axis—to remove the domain path and change the tick line color.`
)}

function _55(md){return(
md`## Ticker

The “ticker” in the bottom-right corner shows the current date.`
)}

function _ticker(barSize,width,margin,n,formatDate,keyframes){return(
function ticker(svg) {
  const now = svg.append("text")
      .style("font", `bold ${barSize}px var(--sans-serif)`)
      .style("font-variant-numeric", "tabular-nums")
      .attr("text-anchor", "end")
      .attr("x", width - 6)
      .attr("y", margin.top + barSize * (n - 0.45))
      .attr("dy", "0.32em")
      .text(formatDate(keyframes[0][0]));

  return ([date], transition) => {
    transition.end().then(() => now.text(formatDate(date)));
  };
}
)}

function _57(md){return(
md`The keyframe’s *date* represents the date at the *end* of the transition; hence, the displayed date is updated when the *transition*.end promise resolves.`
)}

function _58(md){return(
md`The function below is used to [format](https://d3js.org/d3-time-format) dates as four-digit years. If you want a more precise display for shorter time periods, adjust as appropriate.`
)}

function _formatDate(d3){return(
d3.utcFormat("%Y")
)}

function _60(md){return(
md`## Color

That concludes our chart components! Only a few odds and ends left, such as this [ordinal scale](/@d3/d3-scaleordinal?collection=@d3/d3-scale) mapping from category name to color. I chose the Tableau10 [scheme](/@d3/color-schemes) because it is less saturated than Category10.`
)}

function _color(d3,data)
{
  const scale = d3.scaleOrdinal(d3.schemeTableau10);
  if (data.some(d => d.category !== undefined)) {
    const categoryByName = new Map(data.map(d => [d.name, d.category]))
    scale.domain(Array.from(categoryByName.values()));
    return d => scale(categoryByName.get(d.name));
  }
  return d => scale(d.name);
}



function _x(d3,margin,width){return(
d3.scaleLinear([0, 1], [margin.left, width - margin.right])
)}

function _66(n,md){return(
md`The *y*-scale is a [band scale](/@d3/d3-scaleband?collection=@d3/d3-scale), but it’s a bit unusual in that the domain covers *n* + 1 = ${n + 1} ranks, so that bars can enter and exit.`
)}

function _y(d3,n,margin,barSize){return(
d3.scaleBand()
    .domain(d3.range(n + 1))
    .rangeRound([margin.top, margin.top + barSize * (n + 1 + 0.1)])
    .padding(0.1)
)}


function _height(margin,barSize,n){return(
margin.top + barSize * n + margin.bottom
)}

function _barSize(){return(
48
)}

function _margin(){return(
{top: 16, right: 6, bottom: 6, left: 0}
)}

function _72(md){return(
md`## Libraries

We’re using d3@7 for its lovely new [d3.group](/@d3/d3-group) method.`
)}

function _d3(require){return(
require("d3@7")
)}

function _74(md){return(
md`Thanks for reading! 🙏

Please send any corrections or comments via [suggestion](/@observablehq/suggestions-and-comments), or let me know your thoughts and questions on [Twitter](https://twitter.com/mbostock).`
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["category-brands.csv", {url: new URL("./files/aec3792837253d4c6168f9bbecdf495140a5f9bb1cdb12c7c8113cec26332634a71ad29b446a1e8236e0a45732ea5d0b4e86d9d1568ff5791412f093ec06f4f1.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  
  main.variable(observer("data")).define("data", ["d3","FileAttachment"], _data);
  main.variable(observer("viewof replay")).define("viewof replay", ["html"], _replay);
  main.variable(observer("replay")).define("replay", ["Generators", "viewof replay"], (G, _) => G.input(_));
  main.variable(observer("title")).define("title", ["md"], _title);
  main.variable(observer("chart")).define("chart", ["replay","d3","width","height","bars","axis","labels","ticker","keyframes","duration","x","invalidation"], _chart);
  main.variable(observer("duration")).define("duration", _duration);
  main.variable(observer()).define(["data"], _14);
  main.variable(observer()).define(["d3","data"], _16);
  main.variable(observer()).define(["data"], _18);
  main.variable(observer()).define(["n","md"], _19);
  main.variable(observer("n")).define("n", _n);
  main.variable(observer("names")).define("names", ["data"], _names);
  main.variable(observer("datevalues")).define("datevalues", ["d3","data"], _datevalues);
  main.variable(observer("rank")).define("rank", ["names","d3","n"], _rank);
  main.variable(observer()).define(["rank","datevalues"], _29);
  main.variable(observer()).define(["duration","k","md"], _30);
  main.variable(observer("k")).define("k", _k);
  main.variable(observer()).define(["tex","md"], _32);
  main.variable(observer("keyframes")).define("keyframes", ["d3","datevalues","k","rank"], _keyframes);
  main.variable(observer()).define(["n","md"], _34);
  main.variable(observer("nameframes")).define("nameframes", ["d3","keyframes"], _nameframes);
  main.variable(observer("prev")).define("prev", ["nameframes","d3"], _prev);
  main.variable(observer("next")).define("next", ["nameframes","d3"], _next);
  main.variable(observer("bars")).define("bars", ["n","color","y","x","prev","next"], _bars);
  main.variable(observer("labels")).define("labels", ["n","x","prev","y","next","d3","formatNumber"], _labels);
  main.variable(observer("formatNumber")).define("formatNumber", ["d3"], _formatNumber);
  main.variable(observer("axis")).define("axis", ["margin","d3","x","width","barSize","n","y"], _axis);
  main.variable(observer("ticker")).define("ticker", ["barSize","width","margin","n","formatDate","keyframes"], _ticker);
  main.variable(observer("formatDate")).define("formatDate", ["d3"], _formatDate);
  main.variable(observer("color")).define("color", ["d3","data"], _color);
  main.variable(observer("x")).define("x", ["d3","margin","width"], _x);
  main.variable(observer()).define(["n","md"], _66);
  main.variable(observer("y")).define("y", ["d3","n","margin","barSize"], _y);
  main.variable(observer("height")).define("height", ["margin","barSize","n"], _height);
  main.variable(observer("barSize")).define("barSize", _barSize);
  main.variable(observer("margin")).define("margin", _margin);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  
  return main;
}
