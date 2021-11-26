function id_check() {
    $('#email').change(function () {
        $('#id_check_sucess').hide();
        $('#check').show();
        $('#email').attr("check_result", "fail");
      })

      if ($('#email').val() == '') {
        alert('이메일을 입력해주세요.')
        return;
      }

      id_overlap_input = document.querySelector('input[name="email"]');

      $.ajax({
        url: "{% url 'lawyerAccount:id_check' %}",
        data: {
          'email': id_overlap_input.value
        },
        datatype: 'json',
        success: function (data) {
          console.log(data['overlap']);
          if (data['overlap'] == "fail") {
            alert("이미 존재하는 아이디 입니다.");
            id_overlap_input.focus();
            $("#sign_btn").attr("disabled", "disabled");
            return;
          } else {
            alert("사용가능한 아이디 입니다.");
            $('#email').attr("check_result", "success");
            $('#id_check_sucess').show();
            $('#check').attr("disabled", "disabled");
            return;
          }
        }
      });
}

$(function() {
  $("#alert_success").hide();
  $("#alert_danger").hide();
  $("input").keyup(function(){
      var pwd1=$("#pw").val();
      var pwd2=$("#confirm_pw").val();
      if(pwd1 != "" || pwd2 != ""){
          if(pwd2 !=""){
              if(pwd1 == pwd2){
              $("#alert_success").show();
              $("#alert_danger").hide();
              $("#sign_btn").removeAttr("disabled");
          }else{
              $("#alert_success").hide();
              $("#alert_danger").show();
              $("#sign_btn").attr("disabled", "disabled");
          }
      }
          }
  })
})