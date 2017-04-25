
var JSDirective = function(selector, isHTML){
		
		var elements = null;
		var self = this;
		var htmlElements = null;
		var lastScope = null;
		this.model = null;
		
		this.getElements = function(){
			return elements;
		};
		
		this.load = function(model){
			try{
				this.model = model;
				lastScope = createScope(model);
				htmlElements = elements.clone();
				
				executeScope();
				
				delete lastScope;
				lastScope = null;
				if(this.isHTML){
					if(this.isBody){
						htmlElements.find("head").remove();
						htmlElements = htmlElements.children();
					}else if(this.isHead){
						htmlElements.find("body").remove();
						htmlElements = htmlElements.children();
					}
				}
				return htmlElements.length == 1 ? htmlElements[0].outerHTML : $("<div>").append(htmlElements).html();
			}finally{
				htmlElements.empty();
				delete htmlElements;
				htmlElements = null;
			}
			
		};
		
		this.reLoad = function(){
			load(this.model);
		};
		
		var executeScope = function(){
			loadForTags();
			loadIFTags();
			loadShowTags();
			loadHideTags();
			loadSelectedTags();
			loadCheckedTags();
			loadModelReplacements();
		};
		var createScope = function(model){
			var scope =  { names: [], values: [] };
			for(var i in model){
				scope.names.push(i);
				scope.values.push(model[i]);
			}
			return scope;
		};
		
		var loadIFTags = function(){
			lastScope.names.push("");
			htmlElements.find("[js-if]").andSelf().filter("[js-if]").each(function(){
				var code = $(this).attr("js-if");
				
				lastScope.names[lastScope.names.length-1] = ("return "+ code+";");
				var condition = Function.apply(null,lastScope.names);
				
				if(!condition.apply(null, lastScope.values)){
					$(this).remove();
				}
				delete condition;
				condition = null;
				delete code;
				code = null;
				$(this).removeAttr("js-if");
			});
			lastScope.names.pop();
		};
		var loadShowTags = function(){
			lastScope.names.push("");
			htmlElements.find("[js-show]").andSelf().filter("[js-show]").each(function(){
				var code = $(this).attr("js-show");
				
				lastScope.names[lastScope.names.length-1] = ("return "+ code+";");
				var condition = Function.apply(null,lastScope.names);
				
				if(condition.apply(null, lastScope.values)){
					$(this).css("display","block");
				}else{
					$(this).css("display","none");
				}
				delete condition;
				condition = null;
				delete code;
				code = null;
				$(this).removeAttr("js-show");
			});
			lastScope.names.pop();
		};
		var loadHideTags = function(){
			lastScope.names.push("");
			htmlElements.find("[js-hide]").andSelf().filter("[js-hide]").each(function(){
				var code = $(this).attr("js-hide");
				
				lastScope.names[lastScope.names.length-1] = ("return "+ code+";");
				var condition = Function.apply(null,lastScope.names);
				
				if(condition.apply(null, lastScope.values)){
					$(this).css("display","none");
				}else{
					$(this).css("display","block");
				}
				delete condition;
				condition = null;
				delete code;
				code = null;
				$(this).removeAttr("js-hide");
			});
			lastScope.names.pop();
		};
		var loadSelectedTags = function(){
			lastScope.names.push("");
			htmlElements.find("[js-selected]").andSelf().filter("[js-selected]").each(function(){
				var code = $(this).attr("js-selected");
				
				lastScope.names[lastScope.names.length-1] = ("return "+ code+";");
				var condition = Function.apply(null,lastScope.names);
				
				if(condition.apply(null, lastScope.values)){
					$(this).attr('selected',"selected");
				}
				else{
					$(this).removeAttr('selected');
				}
				delete condition;
				condition = null;
				delete code;
				code = null;
				$(this).removeAttr("js-selected");
			});
			lastScope.names.pop();
		};
		var loadCheckedTags = function(){
			lastScope.names.push("");
			htmlElements.find("[js-checked]").andSelf().filter("[js-checked]").each(function(){
				var code = $(this).attr("js-checked");
				
				lastScope.names[lastScope.names.length-1] = ("return "+ code+";");
				var condition = Function.apply(null,lastScope.names);
				
				if(condition.apply(null, lastScope.values)){
					$(this).attr('checked',"checked");
				}
				else{
					$(this).removeAttr('checked');
				}
				delete condition;
				condition = null;
				delete code;
				code = null;
				$(this).removeAttr("js-checked");
			});
			lastScope.names.pop();
		};
		var loadModelReplacements = function(){
			//pega html para realizar replaces
			var html = htmlElements.length == 1 ? htmlElements[0].outerHTML : $("<div>").append(htmlElements).html();
			do{
			
				var index = html.indexOf("{{");
				//caso não tenha mais tags de inicio termina o replace
				if(index == -1){
					break;
				}
				
				var endIndex = html.indexOf("}}");
				//verifica se existe tag de fim
				if(endIndex == -1)
					throw "DataTag Error: Expected }} on after position "+index;
				//verifica se a tag do fim é menor que a do inicio
				if(endIndex < index){
					throw "DataTag Error: Expected {{ on before position "+endIndex;
				}	
				//realiza o replace
				try{
					var begin = html.substring(0,index);
				
					var scriptElement = $('<textarea />').html(html.substring(index+2, endIndex));
					var script = scriptElement.text();
					scriptElement.empty();
					delete scriptElement;
				
					lastScope.names.push("return "+ script+";")
					var content = Function.apply(null,lastScope.names);
					lastScope.names.pop();
				
					var end = html.substring(endIndex+2);
				 
					var newContent = content.apply(null,lastScope.values);
					
					if(newContent instanceof JSDirective.RawResult){
						newContent = newContent.html;
					}else{
						newContent = $('<div/>').text(newContent).html();
					}
					html = begin + newContent + end;
					delete content;
					content = null;
					delete newContent;
					newContent = null;
					delete begin;
					begin = null;
					delete script;
					script = null;
					delete end;
					end = null;
				}catch(ex){
					throw "DataTag Error: javascript error on " + index;
				}
				
			}while(true);
			
			htmlElements.empty();
			delete htmlElements;
			htmlElements = null;
			//atualiza html
			htmlElements = (self.isHTML) ? $(new DOMParser().parseFromString(html, "text/html")).children() : $(html);
			
		};
		
		var loadForTags = function(){
			htmlElements.find("[js-forEach]").each(function(){
				var listName = $.trim($(this).attr("js-forEach"));
				$(this).removeAttr("js-forEach");
				
				var newLoopHTML = "";
				var loopHTML = $(this)[0].outerHTML;
				//salva escopo
				var oldHtmlElements = htmlElements;
				var inIndex = listName.indexOf(' in ');
				if(inIndex <= -1)
				{
					//adiciona variaveis no escopo
					lastScope.names.push("i");
					lastScope.names.push("item");
				}else{
					var parts = listName.split(" in ");
					listName = $.trim(parts[1]);
					parts[0] = parts[0].replace("(","").replace(")","");
					
					if(parts[0].indexOf(',') > -1){
						parts = parts[0].split(',');
						lastScope.names.push($.trim(parts[0]));
						lastScope.names.push($.trim(parts[1]));
					}else{
						lastScope.names.push("i");
						lastScope.names.push($.trim(parts[0]));
					}
				}
				var item = undefined;
				lastScope.values.push(item);
				lastScope.values.push(item);
				
				for(var i in self.model[listName]){
					item = self.model[listName][i];
					//adiciona valores do escopo
					lastScope.values[lastScope.values.length-2] = i;
					lastScope.values[lastScope.values.length-1] = item;
					//marca html do novo escopo
					htmlElements = $(loopHTML);						
					
					//executa escopo
					executeScope();
	
					//pega html do escopo
					newLoopHTML += htmlElements[0].outerHTML;
					$.removeData(htmlElements);
					delete htmlElements;
					htmlElements = null;
					delete item;
					item = null;
				}
				
				//elimina variaveis do escopo
				lastScope.names.pop();
				lastScope.names.pop();
				lastScope.values.pop();
				lastScope.values.pop();
				
				//restaura escopo
				htmlElements = oldHtmlElements;
				//seta html do loop
				$(this).replaceWith(newLoopHTML);
			});
		};
		
		//constructor
		(function(selector, isHTML){
		
			
			this.isHTML = isHTML;
			if(isHTML)
			{
				if(typeof selector == "undefined" || selector == null)
					selector = "";
				
				var parsedHTML = $(new DOMParser().parseFromString(selector, "text/html"));
				elements = parsedHTML.children();
				
				if(!/<\s*body((\s)+(.*)+)?>/igm.test(selector)){
					elements.find("body").remove();
				}
				if(!/<\s*head((\s)+(.*)+)?>/igm.test(selector)){
					elements.find("head").remove();
				}
				if(!/<\s*html((\s)+(.*)+)?>/igm.test(selector)){
					elements = elements.children();
				}
				if(elements.length == 1){
					var tagName = elements[0].tagName;
					if(["BODY","HEAD","HTML"].indexOf(tagName) > -1){
						this.isBody = tagName == "BODY";
						this.isHead = tagName == "HEAD";
					}
				}
			}else{
				if(typeof selector == "undefined" || selector == null)
					selector = "body";
				
				elements = $(selector);
				if(elements.length == 1){
					var tagName = elements[0].tagName;
					if(["BODY","HEAD","HTML"].indexOf(tagName) > -1){
						this.isHTML = true;
						var parsedHTML = $(new DOMParser().parseFromString(elements[0].outerHTML, "text/html"))
						elements = parsedHTML.children();
						this.isBody = tagName == "BODY";
						this.isHead = tagName == "HEAD";
					}
				}
			}
			
		}).call(this,selector, isHTML);
};
JSDirective.Scope = function(){
	var directives = [];
	$directivesIDs = arguments;
	for(var i in $directivesIDs){
		var directive = {
				id: $directivesIDs[i],
				selector: "#" + $directivesIDs[i],
				jsDirective: new JSDirective("#" + $directivesIDs[i]),
				load: function($scope){
					if($scope == undefined)
						$scope = $globalScope;
					$(this.selector).replaceWith(this.jsDirective.load($scope));
				},
				html: function($scope){
					if($scope == undefined)
						$scope = $globalScope;
					return this.jsDirective.load($scope);
				}
			};
			directives.push(directive);
		};
return {
			load : function(directiveID, $scope){
				if(typeof directiveID != "string"){
					$scope = directiveID;
					directiveID = null;
				}
				if($scope == undefined)
					$scope = this;
				if(directiveID == null){
					for(var i in directives){
						directives[i].load($scope);
					}
				}else{
					for(var i in directives){
						if(directives[i].id == directiveID){
							directives[i].load($scope);
							break;
						}
					}
				}
			},
			raw : function(html){
				return new JSDirective.RawResult(html);
			}
	};
}
JSDirective.RawResult = function(html){
	this.html = html;
}
JSDirective.controller = function($scopeFunction, $directivesIDs){
	$(function(){
		var directives = [];
		var $globalScope = {
			load : function($scope){
				if($scope == undefined)
					$scope = $globalScope;
				for(var i in directives){
					directives[i].load($scope);
				}
			},
			raw : function(html){
				return new JSDirective.RawResult(html);
			}
		};
		var parameters = [$globalScope];
		if(!($directivesIDs instanceof Array))
			directivesIDs = [directivesIDs];
		
		for(var i in $directivesIDs){
			var directive = {
				id: $directivesIDs[i],
				selector: "#"+$directivesIDs[i],
				jsDirective: new JSDirective("#" + $directivesIDs[i]),
				load: function($scope){
					if($scope == undefined)
						$scope = $globalScope;
					$(this.selector).replaceWith(this.jsDirective.load($scope));
				},
				html: function($scope){
					if($scope == undefined)
						$scope = $globalScope;
					return this.jsDirective.load($scope);
				}
			};
			directives.push(directive);
			parameters.push(directive);
		};
		$scopeFunction.apply(null,parameters);
	});
};