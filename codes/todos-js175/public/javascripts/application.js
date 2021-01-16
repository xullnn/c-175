document.addEventListener('DOMContentLoaded', function() {
	
	let forms = document.querySelectorAll("form.delete", "form.complete_all");
	forms.forEach(form => {
		form.addEventListener('submit', function(e) {
			e.preventDefault();
			e.stopPropagation();
			
			if (confirm("Are you sure? This can not be undone!")) {
				e.target.submit();
			}
		})
	})
	
})
