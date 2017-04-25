# JS Directive
Html preprocessor like Angular but more simple just for studies

```html
<html>
	<head>
		<meta charset="UTF-8">
		<title>JSComet Directives</title>
		<script src="jquery.min.js"></script>
		<script src="js-directives.js"></script>
	</head>
	<body>
		<div id="content">
			<div js-show="selected < 1">DATA SHOW</div>
			<div js-hide="selected >= 4">DATA HIDE</div>
			<div js-if="selected < 3">DATA IF</div>
			<div>A lista tem {{numbers.length}} opções</div>
			<div>{{htmlTest}}</div>
			<div>{{raw(htmlTest)}}</div>
		</div>
		<div id="inputs">
			<select name="teste" id="teste">
				<option js-forEach="(index, number) in numbers" 
						js-selected="selected == index"
						value="{{index}}">{{number}}</option>
			</select>
			<input id="btnReload" type="button" value="reload!"/>
		</div>
		<script>
			$(function(){
				var $scope = new JSDirective.Scope('content', 'inputs');
				$scope.selected = 0;
				$scope.numbers = [];
				$scope.htmlTest =  "<b>aloha</b>";
				for(var i = 0; i < 10;i++)
					$scope.numbers[i] = i * 10;
				
				$scope.updateOption = function(){
					$scope.selected = parseInt($("#teste").val());
					$scope.load('content');//carrega scope somente nessas directives
				};
				$scope.load();//carrega scope em todas as directives
				$("#teste").change($scope.updateOption);
				$("#btnReload").click($scope.updateOption);
			});
		</script>
	</body>
</html>
```