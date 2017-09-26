/**
* scrollVis - encapsulates
* all the code for the visualization
* using reusable charts pattern:
* http://bost.ocks.org/mike/chart/
*/
var scrollVis = function () {
  // constants to define the size
  // and margins of the vis area.
  var width,
      height,
      barsHeight

  var SMALL_RADIUS = (IS_PHONE()) ? 3 : 5;
  var LARGE_RADIUS = (IS_PHONE()) ? 3 : 10;

  if ( IS_PHONE() ){ width = PHONE_VIS_WIDTH }
  else if ( IS_SHORT() ){ width = SHORT_VIS_WIDTH }
  else{ width = VIS_WIDTH} 

  if ( IS_PHONE() ){ height = PHONE_VIS_HEIGHT }
  else if ( IS_SHORT() ){ height = SHORT_VIS_HEIGHT }
  else{ height = VIS_HEIGHT} 

  if ( IS_PHONE() ){ barsHeight = height*.5 }
  else if ( IS_SHORT() ){ barsHeight = height*.65 }
  else{ barsHeight = height*.65} 

  // var barsHeight = ( IS_PHONE() ) ? height*.5 : height*.65;

  margin = ( IS_PHONE() ) ? PHONE_MARGIN : MARGIN;
  var dotMargin = (IS_PHONE() ) ? PHONE_DOT_MARGIN : DOT_MARGIN;

  // Keep track of which visualization
  // we are on and which was the last
  // index activated. When user scrolls
  // quickly, we want to call all the
  // activate functions that they pass.
  var lastIndex = -1;
  var activeIndex = 0;

  var RECAPTURE_AMOUNT = 0;

  // main svg used for visualization
  var svg = null;

  // d3 selection that will be used
  // for displaying visualizations
  var g = null;

  var barPadding = (IS_PHONE()) ? .4 : .1
  var x = d3.scaleBand().rangeRound([0, width]).padding(barPadding),
  y = d3.scaleLinear().rangeRound([barsHeight, 0]);

  y.domain([0, 16000]);

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
    var threshold = thresholdLarge;

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

    g.append("rect")
      .attr("class", "recaptureContainer")
      .attr("y", y(15000))
      .attr("x", x(3))
      .attr("width", 0)
      .attr("height", 0)
      .style("opacity",0)

    g.selectAll(".state.bar")
      .data(barData)
      .enter().append("rect")
        .attr("class", function(d){ return "state bar b" + d.bin})
        .attr("x", function(d) { return x(d.bin); })
        .attr("y", function(d) { return y(d.wealth); })
        .attr("width", x.bandwidth())
        .attr("height", 0);

    g.selectAll(".cutoff.blank")
      .data(barData)
      .enter().append("rect")
        .attr("class", function(d){ return "cutoff blank b" + d.bin})
        .attr("x", function(d) { return x(d.bin); })
        .attr("y", function(d) { return y(threshold); })
        .attr("width", x.bandwidth())
        .attr("height", 0)
        .style("opacity",0)

    g.selectAll(".cutoff.outline")
      .data(barData)
      .enter().append("rect")
        .attr("class", function(d){ return "cutoff outline b" + d.bin})
        .attr("x", function(d) { return x(d.bin); })
        .attr("y", function(d) { return y(threshold); })
        .attr("width", x.bandwidth())
        .attr("height", 0)
        .style("opacity",0)

    g.selectAll(".cutoff.solid")
      .data(barData)
      .enter().append("rect")
        .attr("class", function(d){ return "cutoff solid b" + d.bin})
        .attr("x", function(d) { return x(d.bin); })
        .attr("y", function(d) { return y(threshold); })
        .attr("width", x.bandwidth())
        .attr("height", 0)
        .style("opacity",0)



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
        .call(d3.drag()
          .on("start.interrupt", function() { slider.interrupt(); })
          .on("start drag", function(d) {
            if(d3.select("g.slider").classed("disabled")){ return false}
            var val = dotY.invert(d3.event.y);
            if(val < dotMin){ val = dotMin}
            if(val > dotMax){ val = dotMax}
            d3.select(".dot.b" + d.bin)
              .attr("cy", dotY(val))
            updateBar("user", d.bin, val);
            setRecaptureAmount(activeIndex);
          })
        );




    slider.selectAll(".tax.dot")
      .data(barData)
      .enter().append("circle")
      .attr("class", function(d){ return "tax dot b" + d.bin})
        .attr("cx", function(d) { return x(d.bin) + x.bandwidth()*.5; })
        .attr("cy", function(d) { return dotY(1); })
        .attr("r", SMALL_RADIUS)
        .call(d3.drag()
          .on("start.interrupt", function() { slider.interrupt(); })
          .on("start drag", function(d) {
            if(d3.select("g.slider").classed("disabled")){ return false}
            var val = dotY.invert(d3.event.y);
            if(val < dotMin){ val = dotMin}
            if(val > dotMax){ val = dotMax}
            d3.select(".dot.b" + d.bin)
              .attr("cy", dotY(val))
            updateBar("user", d.bin, val);
            setRecaptureAmount(activeIndex);
          })
        );


    g.append("line")
      .attr("class", "threshold")
      .attr("y1", y(threshold))
      .attr("y2", y(threshold))
      .attr("x1", 0)
      .attr("x2", width)

  function randBetween(min, max) {
    return Math.random() * (max - min) + min;
  }
    d3.selectAll(".mobileButton")
      .on("click", function(){
        if(d3.select(this).classed("disabled")){ return false; }
        d3.selectAll(".mobileButton").classed("active", false)
        d3.select(this).classed("active", true)
        var button = d3.select(this);
        d3.selectAll(".dot")
          .each(function(d,i){
            var val;
            if(button.classed("one")){
              val = 1;
            }
            else if(button.classed("low")){
              val = randBetween(dotMin, 1)
            }
            else if(button.classed("high")){
              val = randBetween(1, dotMax) 
            }else{
              val = randBetween(dotMin,dotMax)
            }
            d3.select(this)
              .transition()
              .attr("cy", dotY(val))
              .on("end", function(d){
                updateBar("user", d.bin, val)
                setRecaptureAmount(activeIndex);
              })

          })
          // .transition()
          // .attr("cy", dotY(1))
          // .on("end", function(d){
          //   updateBar("user", d.bin, 1)
          //   setRecaptureAmount();
          // })
      })

    d3.selectAll(".axis.y .tick line")
      .attr("x1",0)
      .attr("x2",width)
      .style("stroke", function(d, i){
        if (d == 0){ return "#000"}
        else{ return "#dedddd" }
      })

    d3.selectAll(".dotAxis .tick line")
      .attr("x1",0)
      .attr("x2",width)
      .style("stroke", function(d, i){
        if (d == 1){ return "#000"}
        else{ return "#dedddd" }
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
    activateFunctions[5] = function(){ recaptureOne(barData) };
    activateFunctions[6] = function(){ recaptureTwo(barData) };
    activateFunctions[7] = function(){ recaptureThree(barData) };
    activateFunctions[8] = function(){ modelThree(barData) };
    activateFunctions[9] = function(){ modelThreeRecapture(barData) };
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
  function setThreshold(val, delay){
    if(typeof(delay) == "undefined"){
      delay = 0
    }
    d3.select(".threshold")
      .datum({"threshold": val})
      .transition()
      .duration(DURATION)
      .delay(delay)
      .attr("y1", y(val))
      .attr("y2", y(val))
  }
  function getThreshold(){
    return y.invert(d3.select(".threshold").attr("y1"))
  }
  function setRecaptureAmount(passedIndex){
    for(var i = 0; i < passedIndex; i++){
      d3.select("svg").selectAll("*")
        .interrupt("t-" + i)
    }

    if(activeIndex != 5){
      return RECAPTURE_AMOUNT
    }else{
      if(activeIndex == 6){
        wealthVar = "recaptureTwo"
      }
      else if(activeIndex == 7){
        wealthVar = "recaptureThree"
      }else{
        wealthVar = "wealth"
      }

      var ra = 0;
      var threshold = thresholdSmall;

      d3.selectAll(".dot")
        .each(function(d){
          var rate = getRate(d.bin);
          if(rate * d.wealth > threshold){
            ra += rate*d.wealth - threshold
          }
        })

      RECAPTURE_AMOUNT = ra;

      var area = (barsHeight- y(ra)) * x.bandwidth()

      var W = Math.sqrt(area/6.0)*(3.0)
      var H = Math.sqrt(area/6.0)*(2.0)

      d3.select(".recaptureContainer")
        .transition("t-" + passedIndex)
        .duration(1200)
          .style("opacity",1)
          .attr("width", W)
          .attr("height", H)

      if(activeIndex == 5){
        var cutoffs = d3.selectAll(".cutoff.solid.visible").nodes().length
        var startPos = x(3)

        d3.selectAll(".cutoff.solid.visible")
          .style("fill","#fdbf11")
          .style("stroke","#fdbf11")
          .style("opacity",1)
          .transition("t-" + passedIndex)
          .duration(1200)
          .delay(function(d,i){
              if(ANIMATION_DELAY){
                return i *500  
              }else{
                return 0;
              }
            })
            .attr("y", y(15000))
            .attr("x", function(d, i){
              var rate = getRate(d.bin);
              var barArea = (barsHeight - y((rate*d[wealthVar]-threshold))) * x.bandwidth()
              startPos += barArea/H
              d.x = startPos-barArea/H
              return startPos-barArea/H
            })
            .attr("width", function(d,i){
              var rate = getRate(d.bin);
              var barArea = (barsHeight - y((rate*d[wealthVar]-threshold))) * x.bandwidth()
              d.width = barArea/H
              return barArea/H
            })
            .attr("height", function(d,i){
              d.height = H;
              return H
            })
            .on("end", function(d, i){
              ANIMATION_DELAY = false;
            })
      }
      return ra;
    }
  }

  function updateRecaptureAmount(ra1, ra2, passedIndex){
    var wealthVar
    if(passedIndex == 6){
      wealthVar = "recaptureTwo"
    }
    else if(passedIndex == 7){
      wealthVar = "recaptureThree"
    }else{
      wealthVar = "wealth"
    }
    var threshold = d3.select(".threshold").datum().threshold
    var startPos = x(3)

    for(var i = 0; i < passedIndex; i++){
      d3.select("svg").selectAll("*")
        .interrupt("t-" + i)
    }
    var heights = []
    d3.selectAll(".cutoff.solid.visible")
      .each(function(d,i){
        heights.push(parseFloat(d3.select(this).attr("height")))
      })

    var area = (barsHeight- y(ra1)) * x.bandwidth()

    var W = Math.sqrt(area/6.0)*(3.0)
    var H = Math.sqrt(area/6.0)*(2.0)

    d3.selectAll(".cutoff.solid.visible")
      .transition("t-" + passedIndex)
      .duration(DURATION)
        .attr("height", function(d,i){
          return  heights[i] * (ra2/ra1)
        })
        .style("fill","#fdbf11")
        .style("stroke","#fdbf11")
        .attr("x", function(d, i){
          return d.x;
        })
        .attr("width", function(d,i){
          return d.width;
        })
        .attr("y", function(d,i){
          if(ra2 < ra1){
            return parseFloat(d3.select(this).attr("y")) +  ( parseFloat(d3.select(".recaptureContainer").attr("height")) - heights[i] * (ra2/ra1))  
          }else{
            return d3.select(".recaptureContainer").attr("y")
          }
        })
  }

  function calcRecaptureAmount(threshold, wealthVar){
    var recaptureAmount = 0
    var data = d3.selectAll(".dot")
      .each(function(d){
        var rate = getRate(d.bin)
        if(d[wealthVar]*rate > threshold){
          recaptureAmount += d[wealthVar]*rate - threshold;
        }
      })
    return recaptureAmount;
  }
  function getNewThreshold(ra1, ra2, oldThreshold, wealthVar){
    var diffs = []
    var ts = []
    if(ra2 < ra1){
      for(var t = oldThreshold; t >= 0; t -= 100){
        diffs.push(Math.abs(calcRecaptureAmount(t, wealthVar)-ra1))
        ts.push(t)
      }
      r = d3.min(diffs, function(){ return })
      var indexOfMaxValue = diffs.reduce((iMax, x, i, arr) => x < arr[iMax] ? i : iMax, 0);
      return ts[indexOfMaxValue]
    }else{
      for(var t = oldThreshold; t < 20000; t += 100){
        diffs.push(Math.abs(calcRecaptureAmount(t, wealthVar)-ra1))
        ts.push(t)
      }
      var indexOfMaxValue = diffs.reduce((iMax, x, i, arr) => x < arr[iMax] ? i : iMax, 0);
      return ts[indexOfMaxValue]
    }
  }

  function getNewWealth(wealth, recaptured){
    return wealth - recaptured*.5
  }

  function getRate(bin){
    return parseFloat(dotY.invert(d3.select(".dot.b" + bin).attr("cy")))
  }

  var highestIndex = 0;
  function updateBar(inputType, bin, rate, threshold, passedIndex, delay){
    if(passedIndex < highestIndex){
      return false;
    }
    if(typeof(threshold) == "undefined"){
      threshold = getThreshold();
    }
    if(typeof(passedIndex) == "undefined"){
      passedIndex = activeIndex;
    }
    if(typeof(delay) == "undefined"){
      delay = 0;
    }

    highestIndex = passedIndex
    window.setTimeout(function(){
      highestIndex = 0
    }, 1000)

    var wealthVar
    for(var i = 0; i < passedIndex; i++){
      d3.select("svg").selectAll("*")
        .interrupt("t-" + i)
    }
    if(passedIndex == 6){
      wealthVar = "recaptureTwo"
    }
    else if(passedIndex == 7){
      wealthVar = "recaptureThree"
    }else{
      wealthVar = "wealth"
    }

    if(getModel(passedIndex) == "modelOne"){
      d3.select(".state.bar.b" + bin)
        .transition("t-" + passedIndex)
        .duration(DURATION)
        .delay(delay)
          .attr("y", function(d) { return y(d[wealthVar]*rate + threshold - d[wealthVar]) })
          .attr("height", function(d){  return d3.max([0,barsHeight - y(threshold - d[wealthVar]) ]) });
      d3.select(".local.bar.b" + bin)
        .transition("t-" + passedIndex)
        .duration(DURATION)
        .delay(delay)
          .attr("y", function(d) { return y(d[wealthVar]*rate) })
          .attr("height", function(d){  return barsHeight - y(d[wealthVar]*rate) });
    }else{
      d3.select(".state.bar.b" + bin)
        .transition("t-" + passedIndex)
        .duration(DURATION)
        .delay(delay)
          .attr("y", function(d) { return y(d[wealthVar]*rate + rate*(threshold - d[wealthVar])) })
          .attr("height", function(d){ return d3.max([0,barsHeight - y(rate*(threshold - d[wealthVar])) ]) });
      d3.select(".local.bar.b" + bin)
      .transition("t-" + passedIndex)
      .duration(DURATION)
      .delay(delay)
        .attr("y", function(d) { return y(d[wealthVar]*rate) })
        .attr("height", function(d){  return barsHeight - y(d[wealthVar]*rate) });
    }
    if(passedIndex != 5 && passedIndex != 6 && passedIndex != 7){
      d3.selectAll(".cutoff.solid")
        .transition("t-" + passedIndex)
        .duration(DURATION)
        .delay(delay)
          .attr("x", function(d){ return x(d.bin)})
          .attr("width", x.bandwidth())
          .style("fill","#1696d2")
          .style("stroke","#1696d2")
          .attr("y", function(d){
            var barRate = getRate(d.bin)
            if(d[wealthVar] * barRate > threshold){
              return y(d[wealthVar]*barRate)
            }else{
              return y(threshold)
            }
          })
          .attr("height", function(d){
            var barRate = getRate(d.bin)
            if(d[wealthVar] * barRate > threshold){
              return barsHeight - y(d[wealthVar]*barRate - threshold)
            }else{
              return 0
            }
          })
          .style("opacity",1)
    }else{
      d3.selectAll(".cutoff.solid")
        .classed("visible", function(d){
          var barRate = getRate(d.bin)
          return (d.wealth * barRate > threshold)
        })
        .transition("t-" + passedIndex)
        .duration(DURATION)
        .delay(delay)
          .style("opacity", function(d){
            var barRate = getRate(d.bin)
            if(d.wealth * barRate > threshold){
              return 1
            }else{
              return 0
            }
          })
    }

    d3.selectAll(".cutoff:not(.solid)")
      .classed("visible", function(d){
        var barRate = getRate(d.bin)
        return (d.wealth * barRate > threshold)
      })
      .transition("t-" + passedIndex)
      .duration(DURATION)
      .delay(delay)
        .style("opacity", function(d){
          var barRate = getRate(d.bin)
          if(d.wealth * barRate > threshold){
            return 1
          }else{
            return 0
          }
        })
        .attr("y", function(d){
          var barRate = getRate(d.bin)
          if(d[wealthVar] * barRate > threshold){
            return y(d[wealthVar]*barRate)
          }else{
            return y(threshold)
          }
        })
        .attr("height", function(d){
          var barRate = getRate(d.bin)
          if(d[wealthVar] * barRate > threshold){
            return d3.max([0,barsHeight - y((d[wealthVar]*barRate - threshold))])
          }else{
            return 0
          }
        })

    if(inputType == "user" && (passedIndex == 6 || passedIndex == 7)){
      var threshold = d3.select(".threshold").datum().threshold

      var ra1 = (RECAPTURE_AMOUNT == 0) ? 10400 : RECAPTURE_AMOUNT;
      var ra2 = 0;
      d3.selectAll(".dot")
        .transition()
        .duration(DURATION)
        .delay(delay)
        .each(function(d){
            var barRate = (d.bin == bin) ? rate : getRate(d.bin)
            if(d[wealthVar] * barRate > threshold){
              ra2 += d[wealthVar]*barRate-threshold
            }
          })
      var newThreshold = getNewThreshold(ra1, ra2, threshold, wealthVar)
      d3.select(".threshold")
        .datum({"threshold": newThreshold})
        .transition()
        .duration(DURATION)
        .delay(delay)
          .attr("y1", y(newThreshold))
          .attr("y2", y(newThreshold))
          .on("end", function(){
            d3.selectAll(".dot")
              .each(function(d){
                var barRate = (d.bin == bin) ? rate : getRate(d.bin)
                updateBar("animate", d.bin, barRate, newThreshold,passedIndex)
              })
          })      
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
    d3.select("g.slider").classed("disabled", true)
    d3.selectAll(".state.bar")
      .transition("t-0")
      .duration(DURATION)
      .attr("height",0)
      .attr("y", function(d,i){
        return y(d.wealth)
      })
  }

  function baseModelOne(barData){
    d3.select("g.slider").classed("disabled", true)
    d3.selectAll(".dot")
      .transition()
        .attr("r", SMALL_RADIUS)
        .attr("cy", dotY(1.0))
        .on("end", function(d){
          updateBar("animate", d.bin, 1.0,thresholdLarge,1)
        })
  }

  function noiseModelOne(barData){
    d3.select("g.slider").classed("disabled", true)
    d3.selectAll(".dot")
      .transition()
        .attr("r", SMALL_RADIUS)
        .attr("cy", dotY(dotMax))
        .on("end", function(d){
          updateBar("animate", d.bin, dotMax,thresholdLarge,2)
        })

    d3.selectAll(".track")
      .transition()
      .style("opacity",0)
      .attr("y2", dotY(dotMax))
    d3.selectAll(".mobileButton")
      .classed("active", false)
      .classed("disabled", true)
      .transition()
      .style("opacity",0)

  }

  function increaseModelOne(barData){
    d3.select("g.slider").classed("disabled", false)
    d3.select(".recaptureContainer")
      .transition()
        .style("opacity",0)
    setThreshold(thresholdLarge)
    d3.selectAll(".dot")
      .transition()
        .attr("r", LARGE_RADIUS)
        .on("end", function(d){
          updateBar("animate", d.bin, dotY.invert(d3.select(this).attr("cy")), thresholdLarge,3)
        })
    if(!IS_PHONE()){
      d3.selectAll(".track")
        .transition()
          .style("opacity",1)
          .attr("y2", dotY(dotMin))
    }
    d3.selectAll(".mobileButton")
      .classed("active", false)
      .classed("disabled", false)
      .transition()
      .style("opacity",1)
  }

  function baseModelTwo(barData){
    ANIMATION_DELAY = true;
    d3.select("g.slider").classed("disabled", false)
    d3.select(".recaptureContainer")
      .transition()
        .style("opacity",0)
    setThreshold(thresholdSmall, 1200)
    d3.selectAll(".dot")
      .each(function(d){
        updateBar("animate", d.bin, dotY.invert(d3.select(this).attr("cy")), thresholdLarge,4)        
      })
    d3.selectAll(".dot")
      .each(function(d){
        updateBar("animate", d.bin, dotY.invert(d3.select(this).attr("cy")), thresholdSmall,4, 1200)        
      })
  }

  function recaptureOne(barData){
    d3.select(".recaptureContainer")
      .transition()
        .style("opacity",1)
    d3.select("g.slider").classed("disabled", false)
    var threshold = thresholdSmall;
    setThreshold(thresholdSmall)
    d3.selectAll(".cutoff")
      .classed("visible", function(d){
        var rate = getRate(d.bin)
        updateBar("animate", d.bin, rate, thresholdSmall,5)   
        return (d.wealth * rate > threshold)
      })
    var recaptureAmount = setRecaptureAmount(5);
  }

  function recaptureTwo(barData){
    d3.select("g.slider").classed("disabled", false).classed("locked", false)
    d3.selectAll(".mobileButton").classed("disabled", false).classed("locked", false)
    var threshold = thresholdSmall;
    var ra1 = (RECAPTURE_AMOUNT == 0) ? 10400 : RECAPTURE_AMOUNT;
    var ra2 = 0;
    d3.selectAll(".dot")
      .each(function(d){
        var rate = getRate(d.bin)
        if(d.wealth * rate > threshold){
          var nw = getNewWealth(d.wealth*rate, d.wealth*rate - threshold)
          ra2 += nw-threshold
          d3.select(".state.bar.b" + d.bin)
            .datum(function(d){
              d.recaptureTwo = nw/rate;
              return d;
            })
          updateBar("animate", d.bin, rate, thresholdSmall,6)        
        }else{
          updateBar("animate", d.bin, rate, thresholdSmall,6)        
        }
      })
    updateRecaptureAmount(ra1, ra2,6)
    var newThreshold = getNewThreshold(ra1, ra2, threshold, "recaptureTwo")
    d3.select(".threshold")
      .datum({"threshold": newThreshold})
      .transition()
      .delay(800)
      .duration(DURATION)
        .attr("y1", y(newThreshold))
        .attr("y2", y(newThreshold))
        .on("end", function(){
          d3.selectAll(".dot")
          .each(function(d){
            var rate = getRate(d.bin)
            updateBar("animate", d.bin, rate, newThreshold,6)
            updateRecaptureAmount(ra2, ra1,6)     
          })
        })

  }
  function recaptureThree(barData){
    d3.select(".recaptureContainer")
      .transition()
        .style("opacity",1)
    d3.select("g.slider").classed("disabled", false).classed("locked", false)
    d3.selectAll(".mobileButton").classed("disabled", false).classed("locked", false)
      .transition()
        .style("opacity",1)
    var threshold = d3.select(".threshold").datum().threshold
    var ra1 = (RECAPTURE_AMOUNT == 0) ? 10400 : RECAPTURE_AMOUNT;
    var ra2 = 0;
    d3.selectAll(".dot")
      .each(function(d){
        d3.select(this)
          .transition()
            .style("fill", "#af206b")
            .style("stroke", "#eb098a")
        var rate = getRate(d.bin)
        if(d.recaptureTwo * rate > threshold){
          var nw = getNewWealth(d.recaptureTwo*rate, d.recaptureTwo*rate - threshold)
          ra2 += nw-threshold
          d3.select(".state.bar.b" + d.bin)
            .datum(function(d){
              d.recaptureThree = nw/rate;
              return d;
            })
          updateBar("animate", d.bin, rate, threshold,7)        
        }else{
          updateBar("animate", d.bin, rate, threshold,7)        
        }
      })
    updateRecaptureAmount(ra1, ra2,7)
    var newThreshold = getNewThreshold(ra1, ra2, threshold, "recaptureThree")
    d3.select(".threshold")
      .datum({"threshold": newThreshold})
      .transition()
        .delay(800)
        .duration(DURATION)
        .attr("y1", y(newThreshold))
        .attr("y2", y(newThreshold))
        .on("end", function(){
          d3.selectAll(".dot")
            .each(function(d){
              var rate = getRate(d.bin)
              updateBar("animate", d.bin, rate, newThreshold,7)
              updateRecaptureAmount(ra2, ra1,7)     
          })
        })
  }
  function modelThree(barData){
    d3.select("g.slider").classed("disabled", false)
    d3.select(".recaptureContainer")
      .transition()
        .style("opacity",0)
    setThreshold(thresholdLarge)
    d3.selectAll(".dot")
      .each(function(d,i){
        d3.select(this)
        .transition()
        .duration(500)
        .delay(i*20)
          .attr("cy", dotY(1))
          .attr("r", LARGE_RADIUS)
          .style("fill", "#9d9d9d")
          .style("stroke", "#9d9d9d")
          .on("end", function(d){
            var rate = getRate(d.bin)
            updateBar("animate", d.bin, rate, thresholdLarge,8)
            d3.selectAll(".mobileButton").classed("disabled", true).classed("active",false).classed("locked", true)
              .transition()
                .style("opacity",.3)
            d3.select("g.slider").classed("disabled", true).classed("locked", true)
          })
      })

  }
  function modelThreeRecapture(barData){
    d3.select("g.slider").classed("disabled", false).classed("locked", true)

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
      d.recaptureTwo = +d.wealth;
      d.recaptureThree = +d.wealth;
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
