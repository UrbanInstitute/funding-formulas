/**
 * scrollVis - encapsulates
 * all the code for the visualization
 * using reusable charts pattern:
 * http://bost.ocks.org/mike/chart/
 */
var scrollVis = function () {
  // constants to define the size
  // and margins of the vis area.
  var width;
  var height;
  

  if ( IS_PHONE() ){ width = PHONE_VIS_WIDTH }
  else if ( IS_SHORT() ){ width = SHORT_VIS_WIDTH }
  else{ width = VIS_WIDTH} 

  if ( IS_PHONE() ){ height = PHONE_VIS_HEIGHT }
  else if ( IS_SHORT() ){ height = SHORT_VIS_HEIGHT }
  else{ height = VIS_HEIGHT} 

  var barsHeight = height*.7;

  margin = ( IS_PHONE() ) ? PHONE_MARGIN : MARGIN;

  // Keep track of which visualization
  // we are on and which was the last
  // index activated. When user scrolls
  // quickly, we want to call all the
  // activate functions that they pass.
  var lastIndex = -1;
  var activeIndex = 0;

  // main svg used for visualization
  var svg = null;

  // d3 selection that will be used
  // for displaying visualizations
  var g = null;

  var threshold = 10000;

  var x = d3.scaleBand().rangeRound([0, width]).padding(0.1),
  y = d3.scaleLinear().rangeRound([barsHeight, 0]);

  y.domain([0, 20000]);

  var dotY = d3.scaleLinear().rangeRound([height - dotMargin.bottom, barsHeight + dotMargin.top]);
  dotY.domain([dotMin, dotMax]);   

  // When scrolling to a new section
  // the activation function for that
  // section is called.
  var activateFunctions = [];


  /**
   * chart
   *
   * @param selection - the current d3 selection(s)
   *  to draw the visualization in. For this
   *  example, we will be drawing it in #vis
   */
  var chart = function (selection) {
    selection.each(function (rawData) {
      // create svg and give it a width and height
      svg = d3.select(this).selectAll('svg').data([barData]);
      var svgE = svg.enter().append('svg');
      // @v4 use merge to combine enter and existing selection
      svg = svg.merge(svgE);

      svg.attr('width', width + margin.left + margin.right);
      svg.attr('height', height + margin.top + margin.bottom);

      svg.append('g');


      // this group element will be used to contain all
      // other elements.
      g = svg.select('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      // perform some preprocessing on raw data
      var barData = getData(rawData);

      setupVis(barData);

      setupSections(barData);
    });
  };




  /**
   * setupVis - creates initial elements for all
   * sections of the visualization.
   *
   * @param wordData - data object for each word.
   * @param fillerCounts - nested data that includes
   *  element for each filler word type.
   * @param histData - binned histogram data
   */
  var setupVis = function (barData) {    
    x.domain(barData.map(function(d) { return d.bin; }));

    g.append("g")
      .attr("class", "axis y")
      .call(d3.axisLeft(y).ticks(10, "$,.0f"))

    g.selectAll(".local.bar")
      .data(barData)
      .enter().append("rect")
        .attr("class", function(d){ return "local bar b" + d.bin})
        .attr("x", function(d) { return x(d.bin); })
        .attr("y", function(d) { return y(d.wealth); })
        .attr("width", x.bandwidth())
        .attr("height", function(d) { return barsHeight - y(d.wealth); });

    g.selectAll(".state.bar")
      .data(barData)
      .enter().append("rect")
        .attr("class", function(d){ return "state bar b" + d.bin})
        .attr("x", function(d) { return x(d.bin); })
        .attr("y", function(d) { return y(d.wealth); })
        .attr("width", x.bandwidth())
        .attr("height", 0);


    g.append("g")
      .attr("class", "axis dotAxis")
      .call(d3.axisLeft(dotY).tickValues([dotMin,1,dotMax]))

var slider = g
    .append("g")
    .attr("class", "slider")
    // .attr("transform", "translate(" + margin.left + "," + (barsHeight + dotMargin.top) + ")");


  slider
  .selectAll(".track")
  .data(barData)
  .enter()
  .append("line")
    .attr("class", "track")
    .attr("x1", function(d) { return x(d.bin) + x.bandwidth()*.5 })
    .attr("x2", function(d) { return x(d.bin) + x.bandwidth()*.5 })
    .attr("y1", dotY(dotMax))
    .attr("y2", dotY(dotMax))
    .style("opacity",0)
  // .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
  //   .attr("class", "track-inset")
  // .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
  //   .attr("class", "track-overlay")
    .call(d3.drag()
        .on("start.interrupt", function() { slider.interrupt(); })
        .on("start drag", function(d) {
          d3.select(".dot.b" + d.bin)
            .attr("cy", dotY(dotY.invert(d3.event.y)))
          updateBar(d.bin, dotY.invert(d3.event.y));
        }));




    slider.selectAll(".tax.dot")
      .data(barData)
      .enter().append("circle")
        .attr("class", function(d){ return "tax dot b" + d.bin})
        .attr("cx", function(d) { return x(d.bin) + x.bandwidth()*.5; })
        .attr("cy", function(d) { return dotY(1); })
        .attr("r", 5)
    .call(d3.drag()
        .on("start.interrupt", function() { slider.interrupt(); })
        .on("start drag", function(d) {
          d3.select(".dot.b" + d.bin)
            .attr("cy", dotY(dotY.invert(d3.event.y)))
          updateBar(d.bin, dotY.invert(d3.event.y));
        }));


    g.selectAll(".threshold")
      .data(barData)
      .enter().append("line")
        .attr("class", function(d){ return "threshold b" + d.bin})
        .attr("y1", y(threshold))
        .attr("y2", y(threshold))
        .attr("x1", function(d){ return x(d.bin) })
        .attr("x2", function(d){ return x(d.bin) + x.bandwidth()*1.1 })


    d3.select("#resetDots")
      .on("click", function(){
        d3.selectAll(".dot")
          .transition()
          .attr("cy", dotY(1))
          .on("end", function(d){
            updateBar(d.bin, 1)
          })
      })


  };


  function getModel(index){
    if(index < 4){
      return "modelOne"
    }
    else if(index < 6){
      return "modelTwo"
    }
    else if(index < 9){
      return "recapture"
    }else{
      return "modelThree"
    }
  }

  /**
   * setupSections - each section is activated
   * by a separate function. Here we associate
   * these functions to the sections based on
   * the section's index.
   *
   */
  var setupSections = function (barData) {
    // activateFunctions are called each
    // time the active section changes
    activateFunctions[0] = function(){ localModelOne(barData) };
    activateFunctions[1] = function(){ baseModelOne(barData) };
    activateFunctions[2] = function(){ noiseModelOne(barData) };
    activateFunctions[3] = function(){ increaseModelOne(barData) };
    activateFunctions[4] = function(){ baseModelTwo(barData) };
    activateFunctions[5] = function(){ noiseModelTwo(barData) };
    activateFunctions[6] = function(){ recaptureOne(barData) };
    activateFunctions[7] = function(){ recaptureTwo(barData) };
    activateFunctions[8] = function(){ recaptureThree(barData) };
    activateFunctions[9] = function(){ modelThree(barData) };
    activateFunctions[10] = function(){ modelThreeRecapture(barData) };
  };

  /**
   * ACTIVATE FUNCTIONS
   *
   * These will be called their
   * section is scrolled to.
   *
   * General pattern is to ensure
   * all content for the current section
   * is transitioned in, while hiding
   * the content for the previous section
   * as well as the next section (as the
   * user may be scrolling up or down).
   *
   */


  function getRate(bin){
    return parseFloat(dotY.invert(d3.select(".dot.b" + bin).attr("cy")))
  }
  function updateBar(bin, rate){
    if(getModel(activeIndex) == "modelOne"){
      d3.select(".state.bar.b" + bin)
        .transition()
        .attr("y", function(d) { return y(d.wealth*rate + threshold - d.wealth) })
        .attr("height", function(d){  return d3.max([0,barsHeight - y(threshold - d.wealth) ]) });
      d3.select(".local.bar.b" + bin)
        .transition()
        .attr("y", function(d) { return y(d.wealth*rate) })
        .attr("height", function(d){  return barsHeight - y(d.wealth*rate) });
    }else{
      d3.select(".state.bar.b" + bin)
        .transition()
        .attr("y", function(d) { return y(d.wealth*rate + rate*(threshold - d.wealth)) })
        .attr("height", function(d){  return d3.max([0,barsHeight - y(rate*(threshold - d.wealth)) ]) });
      d3.select(".local.bar.b" + bin)
        .transition()
        .attr("y", function(d) { return y(d.wealth*rate) })
        .attr("height", function(d){  return barsHeight - y(d.wealth*rate) });
    }

  }
  /**
   * showTitle - initial title
   *
   * hides: count title
   * (no previous step to hide)
   * shows: intro title
   *
   */
  function localModelOne(barData) {

  }

  function baseModelOne(barData){
    d3.selectAll(".dot")
      .transition()
      .attr("cy", dotY(1.0))
      .on("end", function(d){
        updateBar(d.bin, 1.0)
      })
  }

  function noiseModelOne(barData){
    d3.selectAll(".dot")
      .transition()
      .attr("r", 5)
      .attr("cy", dotY(dotMax))
      .on("end", function(d){
        updateBar(d.bin, dotMax)
      })
    d3.selectAll(".track")
      .transition()
      .style("opacity",0)
      .attr("y2", dotY(dotMax))

  }

  function increaseModelOne(barData){
    d3.selectAll(".dot")
      .transition()
      .attr("r", 10)
      // .attr("cy", dotY(1))
      .on("end", function(d){
        updateBar(d.bin, dotY.invert(d3.select(this).attr("cy")))
      })
    d3.selectAll(".track")
      .transition()
      .style("opacity",1)
      .attr("y2", dotY(dotMin))


  }
  function baseModelTwo(barData){
    d3.selectAll(".dot")
      .each(function(d){
        updateBar(d.bin, dotY.invert(d3.select(this).attr("cy")))
      })
             

  }

  function noiseModelTwo(barData){



  }
  function recaptureOne(barData){



  }
  function recaptureTwo(barData){


  }
  function recaptureThree(barData){
    
  }
  function modelThree(barData){
    
  }
  function modelThreeRecapture(barData){
    
  }



  /**
   * DATA FUNCTIONS
   *
   * Used to coerce the data into the
   * formats we need to visualize
   *
   */


  function getData(data) {
    return data.map(function (d, i) {
      d.wealth = +d.wealth;

      return d;
    });
  }

  /**
   * activate -
   *
   * @param index - index of the activated section
   */
  chart.activate = function (index) {
    activeIndex = index;
    var sign = (activeIndex - lastIndex) < 0 ? -1 : 1;
    var scrolledSections = d3.range(lastIndex + sign, activeIndex + sign, sign);
    scrolledSections.forEach(function (i) {
      activateFunctions[i]();
    });
    lastIndex = activeIndex;
  };


  // return chart function
  return chart;
};



/**
 * display - called once data
 * has been loaded.
 * sets up the scroller and
 * displays the visualization.
 *
 * @param data - loaded tsv data
 */
function display(rawData) {
  if(getInternetExplorerVersion() != -1){
    IS_IE = true;
  }
  // create a new plot and
  // display it
  var plot = scrollVis();

  d3.select('#vis')
      .style("left", function(){
        if(IS_PHONE()){
          return ( (window.innerWidth - PHONE_VIS_WIDTH - margin.left - margin.right)*.5 ) + "px"
        }
        if(IS_MOBILE()){
          return ( (window.innerWidth - VIS_WIDTH - margin.left - margin.right)*.5 ) + "px"
        }else{
          return "inherit"
        }
      })
      // .style("top", function(){
      //   if(IS_PHONE()){
      //     return ( (window.innerHeight - PHONE_VIS_HEIGHT - margin.top - margin.bottom)*.5 ) + "px"
      //   }
      //   if(IS_MOBILE()){
      //     return ( (window.innerHeight - VIS_HEIGHT - margin.top - margin.bottom)*.5 ) + "px"
      //   }else{
      //     return "20px"
      //   }
      // })
    .datum(rawData)
    .call(plot);

  // setup scroll functionality
  var scroll = scroller()
    .container(d3.select('#graphic'));

  // pass in .step selection as the steps
  scroll(d3.selectAll('.step'));

  scroll.on('resized', function(){
    d3.select("#vis svg").remove()
    display(rawData)
  })

  // setup event handling
  scroll.on('active', function (index) {
    // highlight current step text
    var offOpacity = (IS_MOBILE()) ? 1 : .1
    d3.selectAll('.step')
      .style('opacity', function (d, i) { return i === index ? 1 : offOpacity; });
    // activate current section
    plot.activate(index);  
    
  });

}

// load data and display
d3.csv("data/data.csv", function(data){
      display(data)
});
// 
