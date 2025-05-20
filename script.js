document.addEventListener("DOMContentLoaded", () => {
  // Inicialização da urna
  initializeVotingSystem()
  initializeClock()
  initializeKeyboardSupport()

  // Elementos da interface
  const screens = {
    voting: document.getElementById("votingScreen"),
    admin: document.getElementById("adminScreen"),
    accessibility: document.getElementById("accessibilityScreen"),
    confirmation: document.getElementById("confirmationScreen"),
  }

  const adminElements = {
    login: document.getElementById("adminLogin"),
    panel: document.getElementById("adminPanel"),
    password: document.getElementById("adminPassword"),
    loginBtn: document.getElementById("loginBtn"),
    loginError: document.getElementById("loginError"),
    registerForm: document.getElementById("registerCandidateForm"),
    passwordForm: document.getElementById("changePasswordForm"),
    resetConfirmation: document.getElementById("resetConfirmation"),
  }

  const candidateElements = {
    photo: document.getElementById("candidatePhoto").querySelector("img"),
    name: document.getElementById("candidateName"),
    party: document.getElementById("candidateParty"),
    number: document.getElementById("candidateNumber"),
  }

  // Botões de navegação
  document.getElementById("adminBtn").addEventListener("click", showAdminScreen)
  document.getElementById("accessibilityBtn").addEventListener("click", showAccessibilityScreen)
  document.getElementById("backToVotingBtn").addEventListener("click", showVotingScreen)
  document.getElementById("backFromAccessibilityBtn").addEventListener("click", showVotingScreen)

  // Botões de administrador
  adminElements.loginBtn.addEventListener("click", loginAdmin)
  document.getElementById("registerCandidateBtn").addEventListener("click", showRegisterCandidateForm)
  document.getElementById("reportBtn").addEventListener("click", generateReport)
  document.getElementById("resetBtn").addEventListener("click", showResetConfirmation)
  document.getElementById("changePasswordBtn").addEventListener("click", showChangePasswordForm)

  // Botões de formulário de candidato
  document.getElementById("saveCandidateBtn").addEventListener("click", saveCandidate)
  document.getElementById("cancelCandidateBtn").addEventListener("click", hideRegisterCandidateForm)

  // Botões de formulário de senha
  document.getElementById("savePasswordBtn").addEventListener("click", changePassword)
  document.getElementById("cancelPasswordBtn").addEventListener("click", hideChangePasswordForm)

  // Botões de confirmação de reset
  document.getElementById("confirmResetBtn").addEventListener("click", resetVotingSystem)
  document.getElementById("cancelResetBtn").addEventListener("click", hideResetConfirmation)

  // Botões de acessibilidade
  document.getElementById("increaseFontBtn").addEventListener("click", increaseFontSize)
  document.getElementById("decreaseFontBtn").addEventListener("click", decreaseFontSize)
  document.getElementById("highContrastBtn").addEventListener("click", toggleHighContrast)
  document.getElementById("voiceAssistantBtn").addEventListener("click", toggleVoiceAssistant)

  // Botões de votação
  document.querySelectorAll(".number-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const number = this.getAttribute("data-number")
      addNumberToVote(number)
    })
  })

  document.getElementById("whiteBtn").addEventListener("click", castWhiteVote)
  document.getElementById("correctBtn").addEventListener("click", correctVote)
  document.getElementById("confirmBtn").addEventListener("click", confirmVote)

  // Variáveis globais
  let currentVoteNumber = ""
  let voiceAssistantActive = false
  const speechSynthesis = window.speechSynthesis

  // Funções de inicialização
  function initializeVotingSystem() {
    // Verificar se já existe uma senha de administrador
    if (!localStorage.getItem("adminPassword")) {
      // Definir senha padrão
      localStorage.setItem("adminPassword", "123456")
    }

    // Verificar se já existem candidatos
    if (!localStorage.getItem("candidates")) {
      localStorage.setItem("candidates", JSON.stringify([]))
    }

    // Verificar se já existem votos
    if (!localStorage.getItem("votes")) {
      localStorage.setItem("votes", JSON.stringify({}))
    }
  }

  // Função para inicializar o relógio
  function initializeClock() {
    function updateClock() {
      const now = new Date()
      // Ajustar para o horário de Brasília (GMT-3)
      const brasiliaTime = new Date(now.getTime() - (now.getTimezoneOffset() + 180) * 60000)
      const hours = brasiliaTime.getHours().toString().padStart(2, "0")
      const minutes = brasiliaTime.getMinutes().toString().padStart(2, "0")
      const seconds = brasiliaTime.getSeconds().toString().padStart(2, "0")

      document.getElementById("clock").textContent = `${hours}:${minutes}:${seconds}`
    }

    // Atualizar o relógio imediatamente e depois a cada segundo
    updateClock()
    setInterval(updateClock, 1000)
  }

  // Função para inicializar o suporte ao teclado numérico
  function initializeKeyboardSupport() {
    document.addEventListener("keydown", (event) => {
      // Números de 0 a 9
      if (/^[0-9]$/.test(event.key)) {
        addNumberToVote(event.key)
      }
      // Enter = Confirma
      else if (event.key === "Enter") {
        confirmVote()
      }
      // Backspace = Corrige
      else if (event.key === "Backspace") {
        correctVote()
      }
      // Espaço = Branco
      else if (event.key === " ") {
        castWhiteVote()
      }
    })
  }

  // Funções de navegação entre telas
  function showScreen(screenToShow) {
    Object.values(screens).forEach((screen) => {
      screen.classList.remove("active")
    })
    screenToShow.classList.add("active")
  }

  function showVotingScreen() {
    showScreen(screens.voting)
    resetVotingDisplay()
  }

  function showAdminScreen() {
    showScreen(screens.admin)
    adminElements.login.style.display = "block"
    adminElements.panel.style.display = "none"
    adminElements.password.value = ""
    adminElements.loginError.textContent = ""
  }

  function showAccessibilityScreen() {
    showScreen(screens.accessibility)
  }

  function showConfirmationScreen() {
    showScreen(screens.confirmation)
    setTimeout(showVotingScreen, 3000)
  }

  // Funções de administrador
  function loginAdmin() {
    const password = adminElements.password.value
    const storedPassword = localStorage.getItem("adminPassword")

    if (password === storedPassword) {
      adminElements.login.style.display = "none"
      adminElements.panel.style.display = "block"
      hideAllAdminForms()
    } else {
      adminElements.loginError.textContent = "Senha incorreta"
    }
  }

  function hideAllAdminForms() {
    adminElements.registerForm.style.display = "none"
    adminElements.passwordForm.style.display = "none"
    adminElements.resetConfirmation.style.display = "none"
  }

  function showRegisterCandidateForm() {
    hideAllAdminForms()
    adminElements.registerForm.style.display = "block"
    document.getElementById("candidateNumberInput").value = ""
    document.getElementById("candidateNameInput").value = ""
    document.getElementById("candidatePartyInput").value = ""
    document.getElementById("candidatePhotoInput").value = ""
  }

  function hideRegisterCandidateForm() {
    adminElements.registerForm.style.display = "none"
  }

  function showChangePasswordForm() {
    hideAllAdminForms()
    adminElements.passwordForm.style.display = "block"
    document.getElementById("currentPassword").value = ""
    document.getElementById("newPassword").value = ""
    document.getElementById("confirmNewPassword").value = ""
    document.getElementById("passwordError").textContent = ""
  }

  function hideChangePasswordForm() {
    adminElements.passwordForm.style.display = "none"
  }

  function showResetConfirmation() {
    hideAllAdminForms()
    adminElements.resetConfirmation.style.display = "block"
  }

  function hideResetConfirmation() {
    adminElements.resetConfirmation.style.display = "none"
  }

  // Funções de gerenciamento de candidatos
  function saveCandidate() {
    const number = document.getElementById("candidateNumberInput").value
    const name = document.getElementById("candidateNameInput").value
    const party = document.getElementById("candidatePartyInput").value
    const photoInput = document.getElementById("candidatePhotoInput")

    if (!number || !name || !party) {
      alert("Por favor, preencha todos os campos obrigatórios.")
      return
    }

    const candidates = JSON.parse(localStorage.getItem("candidates"))

    // Verificar se já existe um candidato com este número
    const existingIndex = candidates.findIndex((c) => c.number === number)

    const candidate = {
      number,
      name,
      party,
      photo:
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='150' height='150' fill='%23e0e0e0'/%3E%3Ctext x='50%25' y='50%25' font-size='18' text-anchor='middle' dominant-baseline='middle' fill='%23757575'%3ESem foto%3C/text%3E%3C/svg%3E",
    }

    // Se um arquivo de foto foi selecionado
    if (photoInput.files && photoInput.files[0]) {
      const reader = new FileReader()
      reader.onload = (e) => {
        candidate.photo = e.target.result

        if (existingIndex >= 0) {
          candidates[existingIndex] = candidate
        } else {
          candidates.push(candidate)
        }

        localStorage.setItem("candidates", JSON.stringify(candidates))
        hideRegisterCandidateForm()
        alert("Candidato salvo com sucesso!")
      }
      reader.readAsDataURL(photoInput.files[0])
    } else {
      if (existingIndex >= 0) {
        candidates[existingIndex] = candidate
      } else {
        candidates.push(candidate)
      }

      localStorage.setItem("candidates", JSON.stringify(candidates))
      hideRegisterCandidateForm()
      alert("Candidato salvo com sucesso!")
    }
  }

  // Funções de gerenciamento de senha
  function changePassword() {
    const currentPassword = document.getElementById("currentPassword").value
    const newPassword = document.getElementById("newPassword").value
    const confirmNewPassword = document.getElementById("confirmNewPassword").value
    const passwordError = document.getElementById("passwordError")

    const storedPassword = localStorage.getItem("adminPassword")

    if (currentPassword !== storedPassword) {
      passwordError.textContent = "Senha atual incorreta"
      return
    }

    if (newPassword !== confirmNewPassword) {
      passwordError.textContent = "As senhas não coincidem"
      return
    }

    if (newPassword.length < 4) {
      passwordError.textContent = "A nova senha deve ter pelo menos 4 caracteres"
      return
    }

    localStorage.setItem("adminPassword", newPassword)
    hideChangePasswordForm()
    alert("Senha alterada com sucesso!")
  }

  // Funções de reset da urna
  function resetVotingSystem() {
    localStorage.setItem("candidates", JSON.stringify([]))
    localStorage.setItem("votes", JSON.stringify({}))
    hideResetConfirmation()
    alert("A urna foi zerada com sucesso!")
  }

  // Funções de relatório
  function generateReport() {
    const candidates = JSON.parse(localStorage.getItem("candidates"))
    const votes = JSON.parse(localStorage.getItem("votes"))

    // Importar jsPDF
    const { jsPDF } = window.jspdf

    // Criar novo documento PDF
    const doc = new jsPDF()

    // Título
    doc.setFontSize(18)
    doc.text("Relatório de Votação", 105, 20, { align: "center" })

    // Data e hora
    doc.setFontSize(12)
    doc.text(`Data: ${new Date().toLocaleDateString()}`, 105, 30, { align: "center" })

    // Contagem de votos
    let totalVotes = 0
    const tableData = []

    // Adicionar votos de candidatos
    candidates.forEach((candidate) => {
      const candidateVotes = votes[candidate.number] || 0
      totalVotes += candidateVotes
      tableData.push([candidate.number, candidate.name, candidate.party, candidateVotes.toString()])
    })

    // Adicionar votos brancos e nulos
    const whiteVotes = votes["branco"] || 0
    const nullVotes = votes["nulo"] || 0
    totalVotes += whiteVotes + nullVotes

    tableData.push(["", "Branco", "", whiteVotes.toString()])
    tableData.push(["", "Nulo", "", nullVotes.toString()])

    // Adicionar total
    tableData.push(["", "Total", "", totalVotes.toString()])

    // Criar tabela
    doc.autoTable({
      startY: 40,
      head: [["Número", "Candidato", "Partido", "Votos"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [26, 115, 232] },
    })

    // Salvar o PDF
    doc.save("relatorio-votacao.pdf")
  }

  // Funções de acessibilidade
  function increaseFontSize() {
    const body = document.body
    if (body.classList.contains("font-larger")) {
      return
    } else if (body.classList.contains("font-large")) {
      body.classList.remove("font-large")
      body.classList.add("font-larger")
    } else {
      body.classList.add("font-large")
    }

    if (voiceAssistantActive) {
      speak("Tamanho da fonte aumentado")
    }
  }

  function decreaseFontSize() {
    const body = document.body
    if (body.classList.contains("font-larger")) {
      body.classList.remove("font-larger")
      body.classList.add("font-large")
    } else if (body.classList.contains("font-large")) {
      body.classList.remove("font-large")
    }

    if (voiceAssistantActive) {
      speak("Tamanho da fonte diminuído")
    }
  }

  function toggleHighContrast() {
    document.body.classList.toggle("high-contrast")

    if (voiceAssistantActive) {
      if (document.body.classList.contains("high-contrast")) {
        speak("Modo de alto contraste ativado")
      } else {
        speak("Modo de alto contraste desativado")
      }
    }
  }

  function toggleVoiceAssistant() {
    voiceAssistantActive = !voiceAssistantActive

    if (voiceAssistantActive) {
      speak("Assistente de voz ativado")
    } else {
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel()
      }
    }
  }

  function speak(text) {
    if (!speechSynthesis) return

    if (speechSynthesis.speaking) {
      speechSynthesis.cancel()
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "pt-BR"
    speechSynthesis.speak(utterance)
  }

  // Funções de votação
  function resetVotingDisplay() {
    currentVoteNumber = ""
    candidateElements.photo.src =
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='150' height='150' fill='%23e0e0e0'/%3E%3Ctext x='50%25' y='50%25' font-size='18' text-anchor='middle' dominant-baseline='middle' fill='%23757575'%3ESem foto%3C/text%3E%3C/svg%3E"
    candidateElements.name.textContent = "Candidato"
    candidateElements.party.textContent = "Partido"
    candidateElements.number.textContent = ""

    if (voiceAssistantActive) {
      speak("Digite o número do candidato")
    }
  }

  function addNumberToVote(number) {
    if (currentVoteNumber.length < 2) {
      currentVoteNumber += number
      candidateElements.number.textContent = currentVoteNumber

      // Reproduzir som de tecla
      playKeySound()

      if (voiceAssistantActive) {
        speak(number)
      }

      if (currentVoteNumber.length === 2) {
        findCandidate(currentVoteNumber)
      }
    }
  }

  // Adicionar função de som de tecla
  function playKeySound() {
    const audio = new Audio(
      "data:audio/wav;base64,UklGRpQFAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YXAFAACAgICAgICAgICAgICAgICAgICAgICAgICAf3hxeH+AfXZ1eHx6dnR5fYGFgoOKi42aloubq6GOjI2Op7ythXJ0eYF5aV1AOFFib2E9KSUzRVlgWU5KT1VdaXR/ipmot8bN2dTQzMjAwLWmkIJwbGVnbXJ3gIeQl5yrqrGwsLGvq6SblI2EgXt1cW1qaWppbG9ydXh8gIWLkZieo6Wmp6uqpqKcmZWPioR/e3Zxb2xrbW9ydXh8gYWKkJWcnqKlpqaoqaWhnJiUj4qEgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJiUj4qFgHx3c3Bub3Fzd3t/g4iNkpidoaSnqKmpqaWhnJg=",
    )
    audio.volume = 0.3
    audio.play()
  }

  function findCandidate(number) {
    const candidates = JSON.parse(localStorage.getItem("candidates"))
    const candidate = candidates.find((c) => c.number === number)

    if (candidate) {
      candidateElements.photo.src = candidate.photo
      candidateElements.name.textContent = candidate.name
      candidateElements.party.textContent = candidate.party

      if (voiceAssistantActive) {
        speak(`Candidato ${candidate.name} do partido ${candidate.party}`)
      }
    } else {
      candidateElements.name.textContent = "VOTO NULO"
      candidateElements.party.textContent = ""

      if (voiceAssistantActive) {
        speak("Voto nulo")
      }
    }
  }

  function castWhiteVote() {
    resetVotingDisplay()
    currentVoteNumber = "branco"
    candidateElements.name.textContent = "VOTO EM BRANCO"
    candidateElements.party.textContent = ""

    if (voiceAssistantActive) {
      speak("Voto em branco. Pressione confirma para confirmar seu voto.")
    }
  }

  function correctVote() {
    resetVotingDisplay()

    if (voiceAssistantActive) {
      speak("Voto corrigido")
    }
  }

  function confirmVote() {
    if (currentVoteNumber === "") {
      if (voiceAssistantActive) {
        speak("Por favor, digite um número ou escolha voto em branco")
      }
      return
    }

    // Reproduzir som de confirmação
    playConfirmSound()

    // Registrar o voto
    const votes = JSON.parse(localStorage.getItem("votes"))

    if (currentVoteNumber === "branco") {
      votes["branco"] = (votes["branco"] || 0) + 1
    } else {
      const candidates = JSON.parse(localStorage.getItem("candidates"))
      const candidate = candidates.find((c) => c.number === currentVoteNumber)

      if (candidate) {
        votes[currentVoteNumber] = (votes[currentVoteNumber] || 0) + 1
      } else {
        votes["nulo"] = (votes["nulo"] || 0) + 1
      }
    }

    localStorage.setItem("votes", JSON.stringify(votes))

    if (voiceAssistantActive) {
      speak("Voto confirmado")
    }

    showConfirmationScreen()
  }

  // Adicionar função de som de confirmação
  function playConfirmSound() {
    const audio =
      new Audio(\'data:audio/wav;base64,UklGRrQIAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YZAIAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC

```javascript type="html" project="Urna Eletrônica" file="script.js"
[v0-no-op-code-block-prefix]document.addEventListener('DOMContentLoaded', function() {
    // Adicionar suporte para teclado numérico e relógio de Brasília

    // Adicionar estas funções no início do arquivo, logo após o DOMContentLoaded

    // Inicializar o relógio
    function initClock() {
        updateClock();
        setInterval(updateClock, 1000);
    }

    // Atualizar o relógio com horário de Brasília
    function updateClock() {
        const clockElement = document.getElementById('clock');
        if (!clockElement) return;
        
        // Obter horário de Brasília (GMT-3)
        const now = new Date();
        const brasiliaTime = new Date(now.getTime() - (now.getTimezoneOffset() * 60000) + (-3 * 3600000));
        
        const hours = brasiliaTime.getHours().toString().padStart(2, '0');
        const minutes = brasiliaTime.getMinutes().toString().padStart(2, '0');
        const seconds = brasiliaTime.getSeconds().toString().padStart(2, '0');
        
        clockElement.textContent = `${hours}:${minutes}:${seconds}`
  }

  // Inicialização da urna
  initializeVotingSystem()

  // Elementos da interface
  const screens = {
    voting: document.getElementById("votingScreen"),
    admin: document.getElementById("adminScreen"),
    accessibility: document.getElementById("accessibilityScreen"),
    confirmation: document.getElementById("confirmationScreen"),
  }

  const adminElements = {
    login: document.getElementById("adminLogin"),
    panel: document.getElementById("adminPanel"),
    password: document.getElementById("adminPassword"),
    loginBtn: document.getElementById("loginBtn"),
    loginError: document.getElementById("loginError"),
    registerForm: document.getElementById("registerCandidateForm"),
    passwordForm: document.getElementById("changePasswordForm"),
    resetConfirmation: document.getElementById("resetConfirmation"),
  }

  const candidateElements = {
    photo: document.getElementById("candidatePhoto").querySelector("img"),
    name: document.getElementById("candidateName"),
    party: document.getElementById("candidateParty"),
    number: document.getElementById("candidateNumber"),
  }

  // Botões de navegação
  document.getElementById("adminBtn").addEventListener("click", showAdminScreen)
  document.getElementById("accessibilityBtn").addEventListener("click", showAccessibilityScreen)
  document.getElementById("backToVotingBtn").addEventListener("click", showVotingScreen)
  document.getElementById("backFromAccessibilityBtn").addEventListener("click", showVotingScreen)

  // Botões de administrador
  adminElements.loginBtn.addEventListener("click", loginAdmin)
  document.getElementById("registerCandidateBtn").addEventListener("click", showRegisterCandidateForm)
  document.getElementById("reportBtn").addEventListener("click", generateReport)
  document.getElementById("resetBtn").addEventListener("click", showResetConfirmation)
  document.getElementById("changePasswordBtn").addEventListener("click", showChangePasswordForm)

  // Botões de formulário de candidato
  document.getElementById("saveCandidateBtn").addEventListener("click", saveCandidate)
  document.getElementById("cancelCandidateBtn").addEventListener("click", hideRegisterCandidateForm)

  // Botões de formulário de senha
  document.getElementById("savePasswordBtn").addEventListener("click", changePassword)
  document.getElementById("cancelPasswordBtn").addEventListener("click", hideChangePasswordForm)

  // Botões de confirmação de reset
  document.getElementById("confirmResetBtn").addEventListener("click", resetVotingSystem)
  document.getElementById("cancelResetBtn").addEventListener("click", hideResetConfirmation)

  // Botões de acessibilidade
  document.getElementById("increaseFontBtn").addEventListener("click", increaseFontSize)
  document.getElementById("decreaseFontBtn").addEventListener("click", decreaseFontSize)
  document.getElementById("highContrastBtn").addEventListener("click", toggleHighContrast)
  document.getElementById("voiceAssistantBtn").addEventListener("click", toggleVoiceAssistant)

  // Botões de votação
  document.querySelectorAll(".number-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const number = this.getAttribute("data-number")
      addNumberToVote(number)
    })
  })

  document.getElementById("whiteBtn").addEventListener("click", castWhiteVote)
  document.getElementById("correctBtn").addEventListener("click", correctVote)
  document.getElementById("confirmBtn").addEventListener("click", confirmVote)

  // Variáveis globais
  let currentVoteNumber = ""
  let voiceAssistantActive = false
  const speechSynthesis = window.speechSynthesis

  // Funções de inicialização
  function initializeVotingSystem() {
    // Verificar se já existe uma senha de administrador
    if (!localStorage.getItem("adminPassword")) {
      // Definir senha padrão
      localStorage.setItem("adminPassword", "123456")
    }

    // Verificar se já existem candidatos
    if (!localStorage.getItem("candidates")) {
      localStorage.setItem("candidates", JSON.stringify([]))
    }

    // Verificar se já existem votos
    if (!localStorage.getItem("votes")) {
      localStorage.setItem("votes", JSON.stringify({}))
    }

    initClock()
    setupKeyboardSupport()
  }

  // Adicionar esta função após a inicialização da urna
  function setupKeyboardSupport() {
    document.addEventListener("keydown", (event) => {
      // Números do teclado principal (0-9)
      if (/^[0-9]$/.test(event.key)) {
        addNumberToVote(event.key)
      }
      // Números do teclado numérico (0-9)
      else if (event.keyCode >= 96 && event.keyCode <= 105) {
        const number = (event.keyCode - 96).toString()
        addNumberToVote(number)
      }
      // Tecla Enter = Confirma
      else if (event.key === "Enter") {
        confirmVote()
      }
      // Tecla Backspace = Corrige
      else if (event.key === "Backspace") {
        correctVote()
      }
      // Tecla Espaço = Branco
      else if (event.key === " ") {
        castWhiteVote()
      }
    })
  }

  // Funções de navegação entre telas
  function showScreen(screenToShow) {
    Object.values(screens).forEach((screen) => {
      screen.classList.remove("active")
    })
    screenToShow.classList.add("active")
  }

  function showVotingScreen() {
    showScreen(screens.voting)
    resetVotingDisplay()
  }

  function showAdminScreen() {
    showScreen(screens.admin)
    adminElements.login.style.display = "block"
    adminElements.panel.style.display = "none"
    adminElements.password.value = ""
    adminElements.loginError.textContent = ""
  }

  function showAccessibilityScreen() {
    showScreen(screens.accessibility)
  }

  function showConfirmationScreen() {
    showScreen(screens.confirmation)
    setTimeout(showVotingScreen, 3000)
  }

  // Funções de administrador
  function loginAdmin() {
    const password = adminElements.password.value
    const storedPassword = localStorage.getItem("adminPassword")

    if (password === storedPassword) {
      adminElements.login.style.display = "none"
      adminElements.panel.style.display = "block"
      hideAllAdminForms()
    } else {
      adminElements.loginError.textContent = "Senha incorreta"
    }
  }

  function hideAllAdminForms() {
    adminElements.registerForm.style.display = "none"
    adminElements.passwordForm.style.display = "none"
    adminElements.resetConfirmation.style.display = "none"
  }

  function showRegisterCandidateForm() {
    hideAllAdminForms()
    adminElements.registerForm.style.display = "block"
    document.getElementById("candidateNumberInput").value = ""
    document.getElementById("candidateNameInput").value = ""
    document.getElementById("candidatePartyInput").value = ""
    document.getElementById("candidatePhotoInput").value = ""
  }

  function hideRegisterCandidateForm() {
    adminElements.registerForm.style.display = "none"
  }

  function showChangePasswordForm() {
    hideAllAdminForms()
    adminElements.passwordForm.style.display = "block"
    document.getElementById("currentPassword").value = ""
    document.getElementById("newPassword").value = ""
    document.getElementById("confirmNewPassword").value = ""
    document.getElementById("passwordError").textContent = ""
  }

  function hideChangePasswordForm() {
    adminElements.passwordForm.style.display = "none"
  }

  function showResetConfirmation() {
    hideAllAdminForms()
    adminElements.resetConfirmation.style.display = "block"
  }

  function hideResetConfirmation() {
    adminElements.resetConfirmation.style.display = "none"
  }

  // Funções de gerenciamento de candidatos
  function saveCandidate() {
    const number = document.getElementById("candidateNumberInput").value
    const name = document.getElementById("candidateNameInput").value
    const party = document.getElementById("candidatePartyInput").value
    const photoInput = document.getElementById("candidatePhotoInput")

    if (!number || !name || !party) {
      alert("Por favor, preencha todos os campos obrigatórios.")
      return
    }

    const candidates = JSON.parse(localStorage.getItem("candidates"))

    // Verificar se já existe um candidato com este número
    const existingIndex = candidates.findIndex((c) => c.number === number)

    const candidate = {
      number,
      name,
      party,
      photo:
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='150' height='150' fill='%23e0e0e0'/%3E%3Ctext x='50%25' y='50%25' font-size='18' text-anchor='middle' dominant-baseline='middle' fill='%23757575'%3ESem foto%3C/text%3E%3C/svg%3E",
    }

    // Se um arquivo de foto foi selecionado
    if (photoInput.files && photoInput.files[0]) {
      const reader = new FileReader()
      reader.onload = (e) => {
        candidate.photo = e.target.result

        if (existingIndex >= 0) {
          candidates[existingIndex] = candidate
        } else {
          candidates.push(candidate)
        }

        localStorage.setItem("candidates", JSON.stringify(candidates))
        hideRegisterCandidateForm()
        alert("Candidato salvo com sucesso!")
      }
      reader.readAsDataURL(photoInput.files[0])
    } else {
      if (existingIndex >= 0) {
        candidates[existingIndex] = candidate
      } else {
        candidates.push(candidate)
      }

      localStorage.setItem("candidates", JSON.stringify(candidates))
      hideRegisterCandidateForm()
      alert("Candidato salvo com sucesso!")
    }
  }

  // Funções de gerenciamento de senha
  function changePassword() {
    const currentPassword = document.getElementById("currentPassword").value
    const newPassword = document.getElementById("newPassword").value
    const confirmNewPassword = document.getElementById("confirmNewPassword").value
    const passwordError = document.getElementById("passwordError")

    const storedPassword = localStorage.getItem("adminPassword")

    if (currentPassword !== storedPassword) {
      passwordError.textContent = "Senha atual incorreta"
      return
    }

    if (newPassword !== confirmNewPassword) {
      passwordError.textContent = "As senhas não coincidem"
      return
    }

    if (newPassword.length < 4) {
      passwordError.textContent = "A nova senha deve ter pelo menos 4 caracteres"
      return
    }

    localStorage.setItem("adminPassword", newPassword)
    hideChangePasswordForm()
    alert("Senha alterada com sucesso!")
  }

  // Funções de reset da urna
  function resetVotingSystem() {
    localStorage.setItem("candidates", JSON.stringify([]))
    localStorage.setItem("votes", JSON.stringify({}))
    hideResetConfirmation()
    alert("A urna foi zerada com sucesso!")
  }

  // Funções de relatório
  function generateReport() {
    const candidates = JSON.parse(localStorage.getItem("candidates"))
    const votes = JSON.parse(localStorage.getItem("votes"))

    // Importar jsPDF
    const { jsPDF } = window.jspdf

    // Criar novo documento PDF
    const doc = new jsPDF()

    // Título
    doc.setFontSize(18)
    doc.text("Relatório de Votação", 105, 20, { align: "center" })

    // Data e hora
    doc.setFontSize(12)
    doc.text(`Data: ${new Date().toLocaleDateString()}`, 105, 30, { align: "center" })

    // Contagem de votos
    let totalVotes = 0
    const tableData = []

    // Adicionar votos de candidatos
    candidates.forEach((candidate) => {
      const candidateVotes = votes[candidate.number] || 0
      totalVotes += candidateVotes
      tableData.push([candidate.number, candidate.name, candidate.party, candidateVotes.toString()])
    })

    // Adicionar votos brancos e nulos
    const whiteVotes = votes["branco"] || 0
    const nullVotes = votes["nulo"] || 0
    totalVotes += whiteVotes + nullVotes

    tableData.push(["", "Branco", "", whiteVotes.toString()])
    tableData.push(["", "Nulo", "", nullVotes.toString()])

    // Adicionar total
    tableData.push(["", "Total", "", totalVotes.toString()])

    // Criar tabela
    doc.autoTable({
      startY: 40,
      head: [["Número", "Candidato", "Partido", "Votos"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [26, 115, 232] },
    })

    // Salvar o PDF
    doc.save("relatorio-votacao.pdf")
  }

  // Funções de acessibilidade
  function increaseFontSize() {
    const body = document.body
    if (body.classList.contains("font-larger")) {
      return
    } else if (body.classList.contains("font-large")) {
      body.classList.remove("font-large")
      body.classList.add("font-larger")
    } else {
      body.classList.add("font-large")
    }

    if (voiceAssistantActive) {
      speak("Tamanho da fonte aumentado")
    }
  }

  function decreaseFontSize() {
    const body = document.body
    if (body.classList.contains("font-larger")) {
      body.classList.remove("font-larger")
      body.classList.add("font-large")
    } else if (body.classList.contains("font-large")) {
      body.classList.remove("font-large")
    }

    if (voiceAssistantActive) {
      speak("Tamanho da fonte diminuído")
    }
  }

  function toggleHighContrast() {
    document.body.classList.toggle("high-contrast")

    if (voiceAssistantActive) {
      if (document.body.classList.contains("high-contrast")) {
        speak("Modo de alto contraste ativado")
      } else {
        speak("Modo de alto contraste desativado")
      }
    }
  }

  function toggleVoiceAssistant() {
    voiceAssistantActive = !voiceAssistantActive

    if (voiceAssistantActive) {
      speak("Assistente de voz ativado")
    } else {
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel()
      }
    }
  }

  function speak(text) {
    if (!speechSynthesis) return

    if (speechSynthesis.speaking) {
      speechSynthesis.cancel()
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "pt-BR"
    speechSynthesis.speak(utterance)
  }

  // Funções de votação
  function resetVotingDisplay() {
    currentVoteNumber = ""
    candidateElements.photo.src =
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='150' height='150' fill='%23e0e0e0'/%3E%3Ctext x='50%25' y='50%25' font-size='18' text-anchor='middle' dominant-baseline='middle' fill='%23757575'%3ESem foto%3C/text%3E%3C/svg%3E"
    candidateElements.name.textContent = "Candidato"
    candidateElements.party.textContent = "Partido"
    candidateElements.number.textContent = ""

    if (voiceAssistantActive) {
      speak("Digite o número do candidato")
    }
  }

  function addNumberToVote(number) {
    if (currentVoteNumber.length < 2) {
      currentVoteNumber += number
      candidateElements.number.textContent = currentVoteNumber

      if (voiceAssistantActive) {
        speak(number)
      }

      if (currentVoteNumber.length === 2) {
        findCandidate(currentVoteNumber)
      }
    }
  }

  function findCandidate(number) {
    const candidates = JSON.parse(localStorage.getItem("candidates"))
    const candidate = candidates.find((c) => c.number === number)

    if (candidate) {
      candidateElements.photo.src = candidate.photo
      candidateElements.name.textContent = candidate.name
      candidateElements.party.textContent = candidate.party

      if (voiceAssistantActive) {
        speak(`Candidato ${candidate.name} do partido ${candidate.party}`)
      }
    } else {
      candidateElements.name.textContent = "VOTO NULO"
      candidateElements.party.textContent = ""

      if (voiceAssistantActive) {
        speak("Voto nulo")
      }
    }
  }

  function castWhiteVote() {
    resetVotingDisplay()
    currentVoteNumber = "branco"
    candidateElements.name.textContent = "VOTO EM BRANCO"
    candidateElements.party.textContent = ""

    if (voiceAssistantActive) {
      speak("Voto em branco. Pressione confirma para confirmar seu voto.")
    }
  }

  function correctVote() {
    resetVotingDisplay()

    if (voiceAssistantActive) {
      speak("Voto corrigido")
    }
  }

  function confirmVote() {
    if (currentVoteNumber === "") {
      if (voiceAssistantActive) {
        speak("Por favor, digite um número ou escolha voto em branco")
      }
      return
    }

    // Registrar o voto
    const votes = JSON.parse(localStorage.getItem("votes"))

    if (currentVoteNumber === "branco") {
      votes["branco"] = (votes["branco"] || 0) + 1
    } else {
      const candidates = JSON.parse(localStorage.getItem("candidates"))
      const candidate = candidates.find((c) => c.number === currentVoteNumber)

      if (candidate) {
        votes[currentVoteNumber] = (votes[currentVoteNumber] || 0) + 1
      } else {
        votes["nulo"] = (votes["nulo"] || 0) + 1
      }
    }

    localStorage.setItem("votes", JSON.stringify(votes))

    if (voiceAssistantActive) {
      speak("Voto confirmado")
    }

    showConfirmationScreen()
  }
})
