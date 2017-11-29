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
      barsHeight,
      recaptureContainerX,
      recaptureContainerY;

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

  if(IS_PHONE()){ recaptureContainerX = 3; recaptureContainerY = 15000;}
  else{ recaptureContainerX = 11; recaptureContainerY = 16300;}

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

  y.domain([0, 18000]);

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

    var formatter = (IS_PHONE()) ? "$.0s" : "$,.0f"
    var dx = (IS_PHONE()) ? "-37px" : "-54px"
    g.append("g")
      .attr("class", "axis y")
      .call(d3.axisLeft(y).ticks(10, formatter))
      .append("text")
        .attr("class", "axisLabel")
        .attr("y", 6)
        .attr("dy", "-24px")
        .attr("dx", dx)
        .style("text-anchor", "start")
        .text("Funding per student");

    g.selectAll(".local.bar")
      .data(barData)
      .enter().append("rect")
        .attr("class", function(d){ return "local bar b" + d.bin})
        .attr("x", function(d) { return x(d.bin); })
        .attr("y", function(d) { return y(d.wealth); })
        .attr("width", x.bandwidth())
        .attr("height", function(d) { return barsHeight - y(d.wealth); });

    g.append("rect")
      .attr("class", "recaptureContainer recaptureContainerComponents")
      .attr("y", y(recaptureContainerY))
      .attr("x", x(recaptureContainerX))
      .attr("width", 0)
      .attr("height", 0)
      .style("opacity",0)

    g.append("rect")
      .attr("class", "recaptureContainerInner recaptureContainerComponents")
      .attr("y", y(recaptureContainerY))
      .attr("x", x(recaptureContainerX))
      .style("fill", "#fdbf11")
      .attr("width", 0)
      .attr("height", 0)
      .style("opacity",0)

    g.append("text")
      .attr("class", "recaptureTitle recaptureContainerComponents axisLabel")
      .attr("y", y(recaptureContainerY) - 10)
      .attr("x", x(recaptureContainerX) - 4)
      .text("Recaptured amount")
      .style("opacity",0)

    if(IS_PHONE()){
      g.append("line")
        .attr("class", "legendLine")
        .attr("x1", -35)
        .attr("x2", -35 + 25)
        .attr("y1", -70)
        .attr("y2", -70)

      g.append("text")
        .attr("class", "legendText line")
        .attr("x", 0)
        .attr("y", -65)
        .text("Minimum funding per student")

      g.append("rect")
        .attr("class", "legendItem local")
        .attr("width", 10)
        .attr("height", 10)
        .attr("x", -35)
        .attr("y", -50)

      g.append("text")
        .attr("class", "legendText local")
        .attr("x", -15)
        .attr("y", -41)
        .text("Local contribution")

      g.append("rect")
        .attr("class", "legendItem state legendState")
        .attr("width", 10)
        .attr("height", 10)
        .attr("x", 97)
        .attr("y", -50)
        .text("Local")
        .style("opacity",0)

      g.append("text")
        .attr("class", "legendText state legendState")
        .attr("x", 115)
        .attr("y", -41)
        .text("Local")
        .style("opacity",0)
        .text("State contribution")

    }else{
      g.append("line")
        .attr("class", "legendLine")
        .attr("x1", x(2))
        .attr("x2", x(2) + 25)
        .attr("y1", y(17000) + 9)
        .attr("y2", y(17000) + 9)

      g.append("text")
        .attr("class", "legendText line")
        .attr("x", x(2) + 35)
        .attr("y", y(17000) + 15)
        .text("Minimum funding per student")

      // minimum funding per student
      g.append("rect")
        .attr("class", "legendItem local")
        .attr("width", 20)
        .attr("height", 20)
        .attr("x", x(2))
        .attr("y", y(15700))

      g.append("text")
        .attr("class", "legendText local")
        .attr("x", x(2) + 35)
        .attr("y", y(15700) + 15)
        .text("Local contribution")

      g.append("rect")
        .attr("class", "legendItem state legendState")
        .attr("width", 20)
        .attr("height", 20)
        .attr("x", x(2))
        .attr("y", y(14400))
        .style("opacity",0)

      g.append("text")
        .attr("class", "legendText state legendState")
        .attr("x", x(2) + 35)
        .attr("y", y(14400) + 15)
        .style("opacity",0)
        .text("State contribution")

    }

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
      .call(d3.axisLeft(dotY).tickValues([dotMin,1.2,dotMax]).tickFormat(function(d) { return d + "%"; }))
      .append("text")
        .attr("class", "axisLabel")
        .attr("y", dotY(dotMax))
        .attr("dy", "-24px")
        .attr("dx", "-34px")
        .style("text-anchor", "start")
        .text("Property tax rate");

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
            else if(button.classed("one2")){
              val = 1.2
            }
            else if(button.classed("one4")){
              val = 1.4
            }else{
              val = randBetween(dotMin,dotMax)
            }
            d3.select(this)
              .transition()
              .attr("cy", dotY(val))
              .on("end", function(d){
                updateBar("button", d.bin, val)
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
    if(index < 5){
      return "modelOne"
    }
    else if(index < 8){
      return "modelTwo"
    }
    else if(index < 11){
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
    activateFunctions[4] = function(){ lowerThresholdModelOne(barData) };
    activateFunctions[5] = function(){ baseModelTwo(barData) };
    activateFunctions[6] = function(){ increaseModelTwo(barData) };
    activateFunctions[7] = function(){ recaptureOne(barData) };
    activateFunctions[8] = function(){ recaptureTwo(barData) };
    activateFunctions[9] = function(){ recaptureThree(barData) };
    activateFunctions[10] = function(){ modelThree(barData) };
    activateFunctions[11] = function(){ modelThreeRecapture(barData) };
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
  var GLOBAL_W =0;
  var GLOBAL_H = 0;
  function setRecaptureAmount(passedIndex){
    for(var i = 0; i < passedIndex; i++){
      d3.select("svg").selectAll("*")
        .interrupt("t-" + i)
    }

    if(activeIndex != 7){
      return RECAPTURE_AMOUNT
    }else{
      if(activeIndex == 8){
        wealthVar = "recaptureTwo"
      }
      else if(activeIndex == 9){
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
      GLOBAL_W = W;
      GLOBAL_H = H;

      d3.select(".recaptureTitle")
        .transition("t-" + passedIndex)
        .duration(1200)
          .style("opacity",1)
      d3.select(".recaptureContainer")
        .transition("t-" + passedIndex)
        .duration(1200)
          .style("opacity",1)
          .attr("width", W)
          .attr("height", H)
      d3.select(".recaptureContainerInner")
        .transition("t-" + passedIndex)
        .style("opacity",1)
        .delay(500)
        .duration(1200)

          .attr("y", y(recaptureContainerY))          
          .attr("width", W)
          .attr("height", H)

      if(activeIndex == 7){
        var cutoffs = d3.selectAll(".cutoff.solid.visible").nodes().length
        var startPos = x(recaptureContainerX)

        d3.selectAll(".cutoff.solid.visible")
          .style("fill","#fdbf11")
          .style("stroke","#fdbf11")
          .style("opacity",1)
          .attr("data-y", y(recaptureContainerY))
          .transition("t-" + passedIndex)
          .duration(1200)
          .delay(function(d,i){
              if(ANIMATION_DELAY){
                return 500  
              }else{
                return 0;
              }
            })
            .attr("y", y(recaptureContainerY))
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
              d3.select(this)
                .style("opacity",0)
              ANIMATION_DELAY = false;
            })
      }
      return ra;
    }
  }

  function updateRecaptureAmount(ra1, ra2, passedIndex){


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

      var W = (GLOBAL_W == 0) ? Math.sqrt(area/6.0)*(3.0) : GLOBAL_W;
      var H = (GLOBAL_H == 0) ? Math.sqrt(area/6.0)*(2.0) : GLOBAL_H;


      d3.select(".recaptureContainer")
        .transition("t-" + passedIndex)
        .duration(1200)
          .style("opacity",1)
          .attr("width", W)
          .attr("height", H)


    d3.selectAll(".cutoff.solid.visible")
      .transition()
      .style("opacity",0)


    var ratio = (ra2 > ra1) ? 1 : ra2/ra1;

    d3.select(".recaptureContainerInner")
      .transition()
      .style("opacity",1)
      .duration(DURATION)
      .attr("height", H*(ratio))
      .attr("width",W)
      .attr("y", parseFloat(d3.select(".recaptureContainer").attr("y")) + H*(1-ratio))
    // d3.selectAll(".cutoff.solid.visible")
    //   .attr("data-y", function(d,i){
    //     if(ra2 < ra1){
    //       return parseFloat(d3.select(this).attr("y")) +  ( parseFloat(d3.select(".recaptureContainer").attr("height")) - heights[i] * (ra2/ra1))  
    //     }else{
    //       return d3.select(".recaptureContainer").attr("y")
    //     }
    //   })
    //   .transition("t-" + passedIndex)
    //   .duration(DURATION)
    //     .attr("height", function(d,i){
    //       return  heights[i] * (ra2/ra1)
    //     })
    //     .style("fill","#fdbf11")
    //     .style("stroke","#fdbf11")
    //     .attr("x", function(d, i){
    //       return d.x;
    //     })
    //     .attr("width", function(d,i){
    //       return d.width;
    //     })
    //     .attr("y", function(d,i){
    //       if(ra2 < ra1){
    //         return parseFloat(d3.select(this).attr("data-y")) +  ( parseFloat(d3.select(".recaptureContainer").attr("height")) - heights[i] * (ra2/ra1))  
    //       }else{
    //         return d3.select(".recaptureContainer").attr("y")
    //       }
    //     })
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
      var indexOfMaxValue = diffs.reduce(function(iMax, x, i, arr){ return x < arr[iMax] ? i : iMax}, 0);
      return ts[indexOfMaxValue]
    }else{
      for(var t = oldThreshold; t < 20000; t += 100){
        diffs.push(Math.abs(calcRecaptureAmount(t, wealthVar)-ra1))
        ts.push(t)
      }
      var indexOfMaxValue = diffs.reduce(function(iMax, x, i, arr){ return x < arr[iMax] ? i : iMax}, 0);
      return ts[indexOfMaxValue]
    }
  }

  function getNewWealth(wealth, recaptured){
    return wealth - recaptured*.2
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
    if(passedIndex == 8){
      wealthVar = "recaptureTwo"
    }
    else if(passedIndex == 9){
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
    if(passedIndex != 7 && passedIndex != 8 && passedIndex != 9 ){
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
          .style("opacity", 0)
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

    if(inputType == "user"){
      d3.selectAll(".mobileButton").classed("active", false)
    }
    if( (inputType == "user" || inputType == "button") && (passedIndex == 8 || passedIndex == 9)){
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
    d3.selectAll(".legendState")
      .transition()
      .style("opacity",0)
    d3.selectAll(".recaptureContainerComponents")
      .transition()
        .style("opacity",0)
    d3.select("g.slider").classed("disabled", true)

    d3.selectAll(".mobileButton").classed("active", false)

    d3.selectAll(".state.bar")
      .transition("t-0")
      .duration(DURATION)
      .attr("height",0)
      .attr("y", function(d,i){
        return y(d.wealth)
      })
    d3.selectAll(".mobileButton")
      .transition()
      .style("opacity",0)
  }

  function baseModelOne(barData){
    d3.selectAll(".legendState")
      .transition()
      .style("opacity",1)
    d3.selectAll(".recaptureContainerComponents")
      .transition()
        .style("opacity",0)
    d3.select("g.slider").classed("disabled", true)

    d3.selectAll(".mobileButton").classed("active", false)

    d3.selectAll(".dot")
      .transition()
        .attr("r", SMALL_RADIUS)
        .attr("cy", dotY(1.0))
        .on("end", function(d){
          updateBar("animate", d.bin, 1.0,thresholdLarge,1)
        })
    d3.selectAll(".mobileButton")
      .transition()
      .style("opacity",0)
  }

  function noiseModelOne(barData){
    d3.selectAll(".legendState")
      .transition()
      .style("opacity",1)
    d3.selectAll(".recaptureContainerComponents")
      .transition()
        .style("opacity",0)
    d3.select("g.slider").classed("disabled", true)
    
    d3.selectAll(".mobileButton").classed("active", false)
    d3.selectAll(".mobileButton.one2").classed("active", true)


    d3.selectAll(".dot")
      .transition()
        .attr("r", SMALL_RADIUS)
        .attr("cy", dotY(1.2))
        .on("end", function(d){
          updateBar("animate", d.bin, 1.2,thresholdLarge,2)
        })

    d3.selectAll(".track")
      .transition()
      .style("opacity",0)
      .attr("y2", dotY(1.2))
    d3.selectAll(".mobileButton")
      .transition()
      .style("opacity",0)

  }

  function increaseModelOne(barData){
    d3.selectAll(".legendState")
      .transition()
      .style("opacity",1)
    d3.select("g.slider").classed("disabled", false)
    d3.selectAll(".recaptureContainerComponents")
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
      .transition()
      .style("opacity",1)
  }

  function lowerThresholdModelOne(barData){
    d3.selectAll(".legendState")
      .transition()
      .style("opacity",1)
    ANIMATION_DELAY = true;
    d3.selectAll(".dot")
      .transition()
        .attr("r", LARGE_RADIUS)
        .attr("cy", dotY(1.2))
        .on("end", function(d){
          updateBar("animate", d.bin, 1.2, thresholdSmall,4)        
        })

    d3.select("g.slider").classed("disabled", false)
    d3.selectAll(".recaptureContainerComponents")
      .transition()
        .style("opacity",0)
    setThreshold(thresholdSmall, 4)
    // d3.selectAll(".dot")
    //   .transition()
    //     .attr("r", LARGE_RADIUS)
    //     .attr("cy", dotY(1.2))
    //     .on("end", function(d){
    //       updateBar("animate", d.bin, 1.2, thresholdSmall,5)        
    //     })


  }

  function baseModelTwo(barData){
    d3.selectAll(".legendState")
      .transition()
      .style("opacity",1)
    d3.selectAll(".recaptureContainerComponents")
      .transition()
        .style("opacity",0)

    d3.selectAll(".mobileButton").classed("active", false);
    d3.selectAll(".mobileButton.one").classed("active", true)
    

    d3.selectAll(".dot")
      .transition()
        .attr("r", LARGE_RADIUS)
        .attr("cy", dotY(1.0))
        .on("end", function(d){
          updateBar("animate", d.bin, dotY.invert(d3.select(this).attr("cy")), thresholdSmall,5)        
        })
  }
  function increaseModelTwo(barData){
    d3.selectAll(".legendState")
      .transition()
      .style("opacity",1)
    d3.selectAll(".recaptureContainerComponents")
      .transition()
        .style("opacity",0)

    d3.selectAll(".mobileButton").classed("active", false)
    d3.selectAll(".mobileButton.one2").classed("active", true)
        
    d3.selectAll(".dot")
      .transition()
        .attr("cy", dotY(1.2))
        .attr("r", LARGE_RADIUS)
        .on("end", function(d){
          updateBar("animate", d.bin, dotY.invert(d3.select(this).attr("cy")), thresholdSmall,6)        
        })
  }

  function recaptureOne(barData){
    d3.selectAll(".legendState")
      .transition()
      .style("opacity",1)
    d3.selectAll(".recaptureContainerComponents")
      .transition()
        .style("opacity",1)
    d3.selectAll(".dot")
      .transition()
        .attr("r", LARGE_RADIUS)
    d3.select("g.slider").classed("disabled", false)
    var threshold = thresholdSmall;
    setThreshold(thresholdSmall)
    d3.selectAll(".cutoff")
      .classed("visible", function(d){
        var rate = getRate(d.bin)
        updateBar("animate", d.bin, rate, thresholdSmall,7)   
        return (d.wealth * rate > threshold)
      })
    var recaptureAmount = setRecaptureAmount(7);
  }

  function recaptureTwo(barData){
    d3.selectAll(".legendState")
      .transition()
      .style("opacity",1)
    d3.selectAll(".recaptureContainerComponents")
      .transition()
        .style("opacity",1)
    d3.select("g.slider").classed("disabled", false).classed("locked", false)

    d3.selectAll(".mobileButton").classed("disabled", false).classed("locked", false)

    var threshold = thresholdSmall;
    var ra1 = (RECAPTURE_AMOUNT == 0) ? 10400 : RECAPTURE_AMOUNT;
    var ra2 = 0;
    d3.selectAll(".dot")
      .transition()
        .attr("r", LARGE_RADIUS)
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
          updateBar("animate", d.bin, rate, thresholdSmall,8)        
        }else{
          updateBar("animate", d.bin, rate, thresholdSmall,8)        
        }
      })
    updateRecaptureAmount(ra1, ra2,8)
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
            updateBar("animate", d.bin, rate, newThreshold,8)
            updateRecaptureAmount(ra2, ra1,8)     
          })
        })

  }
  function recaptureThree(barData){
    d3.selectAll(".legendState")
      .transition()
      .style("opacity",1)
    d3.selectAll(".recaptureContainerComponents")
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
      .transition()
        .attr("r", LARGE_RADIUS)
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
          updateBar("animate", d.bin, rate, threshold,9)        
        }else{
          updateBar("animate", d.bin, rate, threshold,9)        
        }
      })
    updateRecaptureAmount(ra1, ra2,9)
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
              updateBar("animate", d.bin, rate, newThreshold,9)
              updateRecaptureAmount(ra2, ra1,9)     
          })
        })
  }
  function modelThree(barData){
    d3.selectAll(".legendState")
      .transition()
      .style("opacity",1)
    d3.selectAll(".recaptureContainerComponents")
      .transition()
        .style("opacity",0)
    d3.select("g.slider").classed("disabled", false)
    d3.selectAll(".recaptureContainerComponents")
      .transition()
        .style("opacity",0)
    setThreshold(thresholdLarge)
    d3.selectAll(".dot")
      .transition()
        .attr("r", LARGE_RADIUS)
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
            updateBar("animate", d.bin, rate, thresholdLarge,10)
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
