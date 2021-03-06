;(function(win, doc) {

  var fragment = { 
    render: null, 
    html: 'fragment', 
    json: 'fragment-json', 
    jsonp: 'callback' 
  }

  if (fragment.render === null) {
    fragment.render = function(html, json) {
      var output = html;

      if (win.Mustache !== undefined && win.Mustache.render !== undefined) {
        output = Mustache.render(html, json);
      } else if (win.Handlebars !== undefined && win.Handlebars.compile !== undefined) {
        output = Handlebars.compile(html)(json);
      } else if (win._ !== undefined && win._.template !== undefined) {
        output = _.template(html, json);
      }

      return output;
    };
  }

  var load = function(url, callback) {
    var parser = doc.createElement('a');
    parser.href = url;

    if (parser.hostname == win.location.hostname) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url);
      xhr.onreadystatechange = function() {
        var status = xhr.status
        if (xhr.readyState === 4 && ((status >= 200 && status < 300) || status == 304)) {
          callback(xhr.responseText);
        }
      }
      xhr.send();
    }
    // JSONP
    else {
      url += (parser.search == '' ? '?' : '&') + fragment.jsonp + '=JSONPCallback';
      var script = doc.createElement('script');
      var parent;
      script.src = url;
      JSONPCallback = function(d) {
        callback(JSON.stringify(d));
        JSONPCallback = null;
        parent = script.parentNode;
        if(parent) {
          parent.removeChild(script);
        }
        script = null;
      };
      doc.getElementsByTagName('head')[0].appendChild(script);
    }
  };

  var status = false; 
  var stack = [];

  function ready(fn){
    if(typeof fn != 'function' || Object.prototype.toString.call(fn) != '[object Function]') {
      return;
    }
    if(status) {
      setTimeout(fn, 0);
    } else {
      stack.push(fn);
    }
  }

  function updateStatus(){ 
    if(!/in/.test(doc.readyState) && doc.body) {
      status = true;
      stack.forEach(function(fn){ 
        setTimeout(fn, 0); 
      })
      stack = [];
    }
    if(!status) {
      setTimeout(updateStatus, 10);
    }
  }

  setTimeout(updateStatus, 10);

  var each = [].forEach

  function evaluate(scope){
    if(!scope || !scope.querySelectorAll) {
      scope = doc;
    }
    var fragments = scope.querySelectorAll('[data-'+fragment.html+'][data-'+fragment.json+']');
    each.call(fragments, function(element) {
      var htmlUrl = element.getAttribute('data-fragment');
      var jsonUrl = element.getAttribute('data-fragment-json');

      load(htmlUrl, function(html) {
        load(jsonUrl, function(json) {
          element.innerHTML = fragment.render(html, JSON.parse(json));
        });
      });
    });

    fragments = scope.querySelectorAll('[data-'+fragment.html+']:not([data-'+fragment.json+'])');
    each.call(fragments, function(element) {
      var htmlUrl = element.getAttribute('data-fragment');

      load(htmlUrl, function(html) {
        if (element.innerHTML == '') {
          element.innerHTML = html;
        }
        else {
          element.innerHTML = fragment.render(html, JSON.parse(element.innerHTML));
        }
      });
    });

    fragments = scope.querySelectorAll('[data-'+fragment.json+']:not([data-'+fragment.html+'])');
    each.call(fragments, function(element) {
      var jsonUrl = element.getAttribute('data-fragment-json');

      load(jsonUrl, function(json) {
        element.innerHTML = fragment.render(element.innerHTML, JSON.parse(json));
      });
    });
  }

  fragment.evaluate = function(){
    ready(evaluate);
  }

  win.fragment = fragment

})(window, window.document);