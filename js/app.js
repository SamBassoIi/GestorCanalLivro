// --- CONFIGURAÇÕES GERAIS ---
const DB_KEY = 'gestor_canal_livro_v45'; // Mantendo V45 para tentar recuperar seus dados
const TURMAS_BASE = ["Infantil 1", "Infantil 2", "Infantil 3", "Infantil 4", "1º Ano Fund", "2º Ano Fund", "3º Ano Fund", "4º Ano Fund", "5º Ano Fund", "6º Ano Fund", "7º Ano Fund", "8º Ano Fund", "9º Ano Fund", "1º Ano Médio", "2º Ano Médio", "3º Ano Médio"];
const LETRAS_OPCOES = ['Todas', 'A', 'B', 'C', 'D'];

// --- VARIÁVEIS GLOBAIS ---
let estadoSelecao = { serie: "3º Ano Médio", letra: "Todas" };
let escolas = [];
let escolaAtivaId = "1"; 
let selectedIds = new Set();
let alunoEditandoId = null;
let somaTemp = 0;
let searchTerm = "";
let nomeArquivoReciboAtual = "Recibo"; 

// --- CATÁLOGO PADRÃO (FALLBACK) ---
const CATALOGO_INICIAL = {
    "Infantil 1": [ {nome: "AMER SUPER SAFARI 1 SB", preco: 233.00}, {nome: "AMER SUPER SAFARI 1 WB", preco: 162.00} ],
    "Infantil 2": [ {nome: "AMER PIPPA AND POP 1 SB", preco: 240.00}, {nome: "AMER PIPPA AND POP 1 WB", preco: 166.00} ],
    "Infantil 3": [ {nome: "AMER PIPPA AND POP 2 SB", preco: 240.00}, {nome: "AMER PIPPA AND POP 2 WB", preco: 166.00} ],
    "Infantil 4": [ {nome: "AMER PIPPA AND POP 3 SB", preco: 240.00}, {nome: "AMER PIPPA AND POP 3 WB", preco: 166.00} ],
    "1º Ano Fund": [ {nome: "AMER GUESS WHAT! 1 SB", preco: 233.00}, {nome: "AMER GUESS WHAT! 1 WB", preco: 175.00}, {nome: "THE WEATHER TODAY", preco: 49.00} ],
    "2º Ano Fund": [ {nome: "GUESS WHAT! 2 SB", preco: 233.00}, {nome: "GUESS WHAT! 2 WB", preco: 175.00}, {nome: "TURTLE IS A HERO", preco: 49.00}, {nome: "DRAW THE WORLD", preco: 58.00} ],
    "3º Ano Fund": [ {nome: "GUESS WHAT! 3 SB", preco: 233.00}, {nome: "GUESS WHAT! 3 WB", preco: 175.00}, {nome: "HOW CHOCOLATE IS MADE", preco: 58.00}, {nome: "BAKING BREAD", preco: 49.00} ],
    "4º Ano Fund": [ {nome: "GUESS WHAT! 4 SB", preco: 233.00}, {nome: "GUESS WHAT! 4 WB", preco: 175.00}, {nome: "MY FIRST TRAIN TRIP", preco: 49.00}, {nome: "THE BOOK OF WORLD FACTS", preco: 58.00} ],
    "5º Ano Fund": [ {nome: "PREPARE! 1 SB", preco: 336.00}, {nome: "PREPARE! 1 WB", preco: 158.00}, {nome: "POWER CUT", preco: 58.00}, {nome: "SUMMER AT THE ZOO", preco: 60.00} ],
    "6º Ano Fund": [ {nome: "SHAPE IT! 1 FULL COMBO", preco: 384.00}, {nome: "ROBIN HOOD", preco: 103.82} ],
    "7º Ano Fund": [ {nome: "SHAPE IT! 2 FULL COMBO", preco: 384.00}, {nome: "MULAN", preco: 103.82} ],
    "8º Ano Fund": [ {nome: "SHAPE IT! 3 FULL COMBO", preco: 384.00}, {nome: "GOING SOLO", preco: 103.82} ],
    "9º Ano Fund": [ {nome: "SHAPE IT! 4 FULL COMBO", preco: 384.00}, {nome: "THE BOY IN THE STRIPED PYJAMAS", preco: 103.82} ],
    "1º Ano Médio": [ {nome: "EVOLVE 4 SB", preco: 351.00}, {nome: "EVOLVE 4 WB", preco: 239.00}, {nome: "THE SPY WHO CAME IN FROM THE COLD", preco: 103.82} ],
    "2º Ano Médio": [ {nome: "EVOLVE 5 SB", preco: 351.00}, {nome: "EVOLVE 5 WB", preco: 239.00}, {nome: "TALES OF THE GREEK HEROES", preco: 103.82} ],
    "3º Ano Médio": [ {nome: "EVOLVE 6 SB", preco: 351.00}, {nome: "EVOLVE 6 WB", preco: 239.00}, {nome: "NINETEEN EIGHTY-FOUR", preco: 103.82} ]
};

// --- INICIALIZAÇÃO SEGURA (EVITA TELA BRANCA) ---
window.onload = function() {
    try {
        carregarDados();
        renderAll();
    } catch (e) {
        console.error("Erro fatal na inicialização:", e);
        // Se der erro fatal, força um reset visual básico
        document.body.innerHTML += `<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);color:white;display:flex;align-items:center;justify-content:center;z-index:9999;"><h1>Erro de Carregamento. <button onclick="localStorage.clear(); location.reload()">Clique para Resetar</button></h1></div>`;
    }
};

function carregarDados() {
    let dadosRaw = localStorage.getItem(DB_KEY);
    
    // Tenta recuperar versoes antigas se nao achar a atual
    if (!dadosRaw) {
        const versoesAntigas = ['gestor_canal_livro_v44_stable', 'gestor_canal_livro_v43_pro', 'gestor_canal_livro_v42_pro'];
        for(let v of versoesAntigas) {
            let d = localStorage.getItem(v);
            if(d) { dadosRaw = d; break; }
        }
    }

    if (dadosRaw) { 
        try { escolas = JSON.parse(dadosRaw); } catch (err) { escolas = []; } 
    }

    if (!Array.isArray(escolas) || escolas.length === 0) {
        escolas = [{id:"1", nome:"Escola Exemplo", alunos:[], precos:{}, livrosPorTurma:JSON.parse(JSON.stringify(CATALOGO_INICIAL))}];
    }

    // Normalização de dados (Evita erros undefined)
    escolas.forEach(e => {
        if (!e.alunos) e.alunos = [];
        if (!e.livrosPorTurma) e.livrosPorTurma = JSON.parse(JSON.stringify(CATALOGO_INICIAL));
        e.alunos.forEach(a => { if (!a.tags) a.tags = []; if (!a.livros) a.livros = []; });
    });

    if (!escolaAtivaId && escolas.length > 0) escolaAtivaId = escolas[0].id.toString();
    else { 
        const existe = escolas.find(e => e.id.toString() === escolaAtivaId);
        if (!existe && escolas.length > 0) escolaAtivaId = escolas[0].id.toString(); 
    }
}

function renderAll() {
    // try-catch em cada render para que um erro em um lugar não trave tudo
    try { renderListaEscolas(); } catch(e) { console.error("Erro renderListaEscolas", e); }
    try { renderSeletorTurmas(); } catch(e) { console.error("Erro renderSeletorTurmas", e); }
    try { renderTabela(); } catch(e) { console.error("Erro renderTabela", e); }
    try { renderCatalogUI(); } catch(e) { console.error("Erro renderCatalogUI", e); }
    try { atualizarDisplayPreco(); } catch(e) { console.error("Erro atualizarDisplayPreco", e); }
}

function save() { 
    try { localStorage.setItem(DB_KEY, JSON.stringify(escolas)); } catch(e) { console.error("Erro ao salvar", e); }
}
function getEscola() { return escolas.find(e => e.id.toString() === escolaAtivaId.toString()) || escolas[0]; }
function showToast(msg, type='success') { 
    if (typeof Toastify === 'function') Toastify({ text: msg, duration: 3000, gravity: "top", position: "right", style: { background: type === 'error' ? "#ef5350" : "#00b09b" } }).showToast(); 
    else alert(msg);
}

// --- IMPORTAÇÃO EXCEL HÍBRIDA (SUPORTA CSV RENOMEADO PARA XLS) ---
function processarExcelEscola(input) {
    const f = input.files[0];
    if(!f) return;

    Swal.fire({ title: 'Lendo Arquivo...', text: 'Processando dados...', allowOutsideClick: false, didOpen: () => { Swal.showLoading() } });

    const reader = new FileReader();
    
    reader.onerror = function() {
        Swal.close(); Swal.fire('Erro', 'Falha ao ler arquivo.', 'error'); input.value = "";
    };

    // Usamos readAsText com codificação brasileira para garantir acentos corretos no seu arquivo
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            // O seu arquivo 2026.xls é um CSV separado por vírgula
            // Vamos usar um parser manual robusto
            parseCSVManual(content);
        } catch (err) {
            console.error(err);
            Swal.close();
            Swal.fire('Erro', 'Formato não reconhecido. Certifique-se que é o arquivo da escola.', 'error');
            input.value = "";
        }
    };
    
    // ISO-8859-1 (Latin1) é o padrão de sistemas escolares brasileiros antigos
    reader.readAsText(f, "ISO-8859-1"); 
}

function parseCSVManual(text) {
    const lines = text.split(/\r\n|\n/);
    let count = 0;
    let escola = getEscola();
    
    // Identifica colunas na primeira linha (Cabeçalho)
    // Formato esperado do seu arquivo: ,Nova,Código,Nome,Curso,Série,Turma...
    
    // Encontrar a linha do cabeçalho
    let headerIndex = -1;
    let colNome = -1, colCurso = -1, colSerie = -1, colTurma = -1;

    for (let i = 0; i < Math.min(20, lines.length); i++) {
        const row = lines[i].toLowerCase();
        if (row.includes('nome') && (row.includes('série') || row.includes('serie'))) {
            headerIndex = i;
            const headers = lines[i].split(','); // Seu arquivo é separado por vírgula
            
            headers.forEach((h, idx) => {
                let cleanH = h.toLowerCase().replace(/"/g, '').trim();
                if(cleanH === 'nome') colNome = idx;
                if(cleanH.includes('curso')) colCurso = idx;
                if(cleanH.includes('série') || cleanH.includes('serie')) colSerie = idx;
                if(cleanH.includes('turma')) colTurma = idx;
            });
            break;
        }
    }

    if (colNome === -1) {
        Swal.close();
        Swal.fire('Erro', 'Não encontrei a coluna "Nome" e "Série" no arquivo.', 'error');
        return;
    }

    // Processar dados
    for (let i = headerIndex + 1; i < lines.length; i++) {
        let line = lines[i];
        if (!line || line.trim() === "") continue;

        // Parser simples de CSV considerando vírgula (ignora aspas complexas para velocidade, dado o formato simples)
        // Se houver vírgula dentro do nome, isso pode quebrar, mas sistemas escolares raramente fazem isso no nome do aluno
        let row = line.split(',');

        // Ajuste se o split falhar em colunas vazias
        if (row.length < colNome) continue;

        let nome = row[colNome] ? row[colNome].replace(/"/g, '').trim() : "";
        if (!nome) continue;

        let rawCurso = colCurso > -1 ? (row[colCurso] || "").replace(/"/g, '') : "";
        let rawSerie = colSerie > -1 ? (row[colSerie] || "").replace(/"/g, '') : "";
        let rawTurma = colTurma > -1 ? (row[colTurma] || "").replace(/"/g, '') : "";

        // Normalização
        let textoAnalise = (rawSerie + " " + rawCurso).toLowerCase();
        let serieFinal = normalizarSerie(textoAnalise);
        if (!serieFinal) serieFinal = normalizarSerie(rawTurma.toLowerCase()); // Tenta pela turma
        if (!serieFinal) serieFinal = estadoSelecao.serie; // Fallback

        let letraFinal = normalizarLetra(rawTurma || rawSerie) || "A";

        // Evita duplicatas exatas
        const existe = escola.alunos.some(a => a.nome.toLowerCase() === nome.toLowerCase() && a.turmaBase === serieFinal);
        
        if(!existe) {
            escola.alunos.push({
                id: Date.now().toString() + Math.random().toString(),
                data: new Date().toLocaleDateString('pt-BR'),
                nome: nome,
                turmaBase: serieFinal,
                turmaCompleta: `${serieFinal} - ${letraFinal}`,
                valor: 0,
                status: 'pendente',
                livros: [],
                obs: '',
                tags: []
            });
            count++;
        }
    }

    save();
    renderAll();
    Swal.close();
    document.getElementById('excelUpload').value = "";
    Swal.fire('Sucesso!', `${count} alunos importados!`, 'success');
}

function normalizarSerie(txt) {
    if (!txt) return null;
    txt = txt.toLowerCase();
    
    if (txt.includes('infantil 1') || txt.includes('inf 1')) return "Infantil 1";
    if (txt.includes('infantil 2') || txt.includes('inf 2')) return "Infantil 2";
    if (txt.includes('infantil 3') || txt.includes('inf 3')) return "Infantil 3";
    if (txt.includes('infantil 4') || txt.includes('inf 4')) return "Infantil 4";
    
    // Fundamental vs Médio
    if (txt.includes('1') && (txt.includes('ano') || txt.includes('série'))) return (txt.includes('médio') || txt.includes('medio')) ? "1º Ano Médio" : "1º Ano Fund";
    if (txt.includes('2') && (txt.includes('ano') || txt.includes('série'))) return (txt.includes('médio') || txt.includes('medio')) ? "2º Ano Médio" : "2º Ano Fund";
    if (txt.includes('3') && (txt.includes('ano') || txt.includes('série'))) return (txt.includes('médio') || txt.includes('medio')) ? "3º Ano Médio" : "3º Ano Fund";
    
    if (txt.includes('4') && txt.includes('ano')) return "4º Ano Fund";
    if (txt.includes('5') && txt.includes('ano')) return "5º Ano Fund";
    if (txt.includes('6') && txt.includes('ano')) return "6º Ano Fund";
    if (txt.includes('7') && txt.includes('ano')) return "7º Ano Fund";
    if (txt.includes('8') && txt.includes('ano')) return "8º Ano Fund";
    if (txt.includes('9') && txt.includes('ano')) return "9º Ano Fund";

    return null;
}

function normalizarLetra(txt) {
    if (!txt) return null;
    txt = txt.toUpperCase();
    const match = txt.match(/\b([A-D])\b/); // Procura letra A, B, C, D isolada
    if (match) return match[1];
    
    // Se a string terminar com a letra (comum em "1º Ano A")
    if (txt.endsWith(' A')) return 'A';
    if (txt.endsWith(' B')) return 'B';
    if (txt.endsWith(' C')) return 'C';
    if (txt.endsWith(' D')) return 'D';

    return null;
}

// --- INTERFACE (SELETORES, LISTAS, ETC) ---
function renderListaEscolas() {
    const l=document.getElementById('listaEscolas'); if(!l) return;
    l.innerHTML='';
    escolas.forEach(e => {
        const li=document.createElement('li'); 
        li.className=`school-item ${e.id.toString()===escolaAtivaId.toString()?'active':''}`;
        const icone = e.logo ? `<img src="${e.logo}" class="school-icon-img">` : e.nome.charAt(0);
        li.innerHTML = `
            <div class="school-icon-circle" onclick="trocarEscola('${e.id}')">${typeof icone==='string'?icone:''}</div>
            ${typeof icone!=='string'?`<div class="school-icon-circle" style="background:none">${icone}</div>`:''}
            <span class="school-name" onclick="trocarEscola('${e.id}')">${e.nome}</span>
            <div class="school-actions">
                <button class="sidebar-action-btn edit" onclick="event.stopPropagation(); iniciarEditarNomeEscolaID(event, '${e.id}')"><i class="fas fa-pen"></i></button>
                ${escolas.length>1 ? `<button class="sidebar-action-btn del" onclick="event.stopPropagation(); deletarEscola('${e.id}')"><i class="fas fa-trash"></i></button>` : ''}
            </div>
        `;
        if(e.logo && typeof icone !== 'string') li.querySelector('.school-icon-circle').innerHTML = `<img src="${e.logo}" class="school-icon-img">`;
        l.appendChild(li);
    });
    const dName = document.getElementById('nomeEscolaDisplay');
    if(dName) dName.innerText = getEscola().nome;
}

function trocarEscola(id) { escolaAtivaId=id.toString(); renderAll(); }

async function iniciarAdicionarEscola() {
    const { value: novoNome } = await Swal.fire({ title: 'Nova Escola', input: 'text', showCancelButton: true });
    if (novoNome) {
        escolas.push({ id: Date.now().toString(), nome: novoNome, alunos: [], precos: {}, livrosPorTurma: JSON.parse(JSON.stringify(CATALOGO_INICIAL)), logo: null });
        save(); escolaAtivaId = escolas[escolas.length-1].id.toString(); renderAll(); showToast("Escola criada!");
    }
}

async function iniciarEditarNomeEscolaID(event, id) { 
    if(event) event.stopPropagation(); 
    const index = escolas.findIndex(e => e.id.toString() === id.toString());
    if (index > -1) {
        const { value } = await Swal.fire({ title: 'Renomear', input: 'text', inputValue: escolas[index].nome, showCancelButton: true });
        if (value) { escolas[index].nome = value; save(); renderListaEscolas(); }
    }
}
function iniciarEditarNomeEscola() { iniciarEditarNomeEscolaID(null, escolaAtivaId); }
function deletarEscola(id) { 
    Swal.fire({ title: 'Apagar escola?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33' }).then((r) => {
        if(r.isConfirmed) { 
            escolas=escolas.filter(x=>x.id.toString()!==id.toString()); 
            if(escolas.length > 0 && escolaAtivaId === id.toString()) escolaAtivaId=escolas[0].id.toString();
            else if (escolas.length === 0) carregarDados(); // Reset se apagar tudo
            save(); renderAll(); showToast("Escola apagada."); 
        }
    });
}
function abrirModalImport() {
    const select = document.getElementById('selectImportSchool'); select.innerHTML = '';
    const outras = escolas.filter(e => e.id.toString() !== escolaAtivaId.toString());
    if(outras.length === 0) { Swal.fire('Atenção', 'Crie outra escola para importar.', 'info'); return; }
    outras.forEach(e => { const o = document.createElement('option'); o.value=e.id; o.innerText=e.nome; select.appendChild(o); });
    abrirModal('modalImport');
}
function confirmarImportacao() {
    const idOrigem = document.getElementById('selectImportSchool').value;
    const origem = escolas.find(e => e.id.toString() === idOrigem.toString()); const atual = getEscola();
    if(origem) { atual.livrosPorTurma = JSON.parse(JSON.stringify(origem.livrosPorTurma)); save(); renderCatalogUI(); showToast("Importado!"); fecharModal('modalImport'); }
}
function alterarLogoEscola() { document.getElementById('logoUpload').click(); }
function processarLogo(input) { if(input.files[0]){ const r=new FileReader(); r.onload=e=>{getEscola().logo=e.target.result; save(); renderListaEscolas(); showToast("Logo salvo!");}; r.readAsDataURL(input.files[0]); } }

function renderSeletorTurmas() {
    const c=document.getElementById('visualTurmaSelector'); if(!c) return;
    c.innerHTML='';
    TURMAS_BASE.forEach(s => {
        const active = s === estadoSelecao.serie;
        const r=document.createElement('div'); r.className=`turma-row ${active?'active':''}`;
        let html = `<div class="turma-header" onclick="selectSerie('${s}')"><span>${s}</span> <i class="fas fa-chevron-down" style="transform:${active?'rotate(180deg)':'rotate(0)'}"></i></div>`;
        html += `<div class="turma-sub-options" style="display:${active?'flex':'none'}">`;
        LETRAS_OPCOES.forEach(l => {
            const isSelected = active && estadoSelecao.letra === l;
            html += `<span class="${l==='Todas'?'class-badge badge-all':'class-badge'} ${isSelected?'selected':''}" onclick="event.stopPropagation(); selectLetra('${s}','${l}')">${l}</span>`;
        });
        html += `</div>`; r.innerHTML = html; c.appendChild(r);
    });
}
function selectSerie(s) { estadoSelecao.serie=s; estadoSelecao.letra='Todas'; refreshUI(); }
function selectLetra(s,l) { estadoSelecao.serie=s; estadoSelecao.letra=l; refreshUI(); }
function refreshUI() { renderSeletorTurmas(); atualizarDisplayPreco(); renderTabela(); document.getElementById('selectCatalogTurma').value = estadoSelecao.serie; renderCatalogTable(); }

function atualizarDisplayPreco() {
    const e=getEscola();
    let catalogo = e.livrosPorTurma?.[estadoSelecao.serie] || [];
    if(catalogo.length && typeof catalogo[0]==='string') catalogo = catalogo.map(n=>({nome:n, preco:0}));
    let v = 0; catalogo.forEach(i=>v+=i.preco);
    
    const txtTurma = document.getElementById('txtTurmaSelecionada');
    if(txtTurma) txtTurma.innerText=`${estadoSelecao.serie} - ${estadoSelecao.letra}`; 
    const txtPreco = document.getElementById('txtPrecoAtual');
    if(txtPreco) txtPreco.innerText=v>0?`R$ ${v.toFixed(2)}`:'Sem Preço'; 
    
    const divAdd = document.getElementById('addAlunoContainer');
    if(divAdd) divAdd.style.display=estadoSelecao.letra==='Todas'?'none':'flex'; 
    const divMsg = document.getElementById('msgTodas');
    if(divMsg) divMsg.style.display=estadoSelecao.letra==='Todas'?'block':'none'; 
    
    let tg=0; e.alunos.forEach(a=>{if(a.valor>0)tg+=a.valor}); 
    const dispTotal = document.getElementById('displayTotalGeral');
    if(dispTotal) dispTotal.innerText=tg.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); 
}
function filtrarTabela() { searchTerm = document.getElementById('searchInput').value.toLowerCase(); renderTabela(); }

function renderTabela() {
    const tb=document.getElementById('tabelaCorpo'); if(!tb) return;
    tb.innerHTML=''; const e=getEscola(); if(!e) return;
    let tot=0, qtd=0;
    
    let lista = e.alunos.filter(a => a.turmaBase === estadoSelecao.serie && (estadoSelecao.letra === 'Todas' || a.turmaCompleta.endsWith(' - '+estadoSelecao.letra)));
    if(searchTerm) lista = lista.filter(a => a.nome.toLowerCase().includes(searchTerm));

    [...lista].reverse().forEach(a => {
        if(a.valor>0) { tot+=a.valor; qtd++; }
        let css = ''; const tags = a.tags || [];
        
        // CORREÇÃO CORES (V49)
        if (tags.some(t => t.startsWith('func'))) css = 'tag-func'; 
        else if (tags.some(t => t.startsWith('day'))) { 
            const dayTag = tags.find(t => t.startsWith('day')); 
            if(dayTag) css = 'tag-' + dayTag; 
        }
        else if (tags.includes('outros')) css = 'tag-entregue'; // CSS corrigido

        let badges = tags.map(t => {
            let lbl = t, bg = '#999';
            if(t.startsWith('day')) { lbl = t.replace('day','')+'º Dia'; bg = '#0288d1'; }
            if(t.startsWith('func')) { lbl = 'Func'; bg = '#512da8'; }
            if(t === 'outros') { lbl = 'Entregue'; bg = '#e65100'; }
            // Novos Pagamentos
            if(t === 'pay_pix') { lbl = 'Pix'; bg = '#0e6251'; }
            if(t === 'pay_debito') { lbl = 'Débito'; bg = '#117864'; }
            if(t === 'pay_cred_vista') { lbl = 'Créd. Vista'; bg = '#1b4f72'; }
            if(t === 'pay_cred_parc') { lbl = 'Créd. Parc'; bg = '#154360'; }
            return `<span class="tag-badge" style="background:${bg}">${lbl}</span>`;
        }).join('');

        const chk = selectedIds.has(a.id) ? 'checked' : '';
        const tr=document.createElement('tr'); tr.className=css;
        tr.innerHTML=`<td class="no-print" align="center"><input type="checkbox" class="custom-checkbox row-checkbox" data-id="${a.id}" ${chk} onchange="toggleSelect('${a.id}')"></td><td><small style="color:#889">${a.data}</small></td><td><span style="font-weight:600; color:var(--brand-primary)">${a.turmaCompleta}</span></td><td><span class="clickable-name" onclick="event.stopPropagation(); abrirDetalhes('${a.id}')">${a.nome}</span> ${a.livros.length?'<i class="fas fa-book" style="color:#27ae60"></i>':''} ${a.obs?'<i class="fas fa-comment-dots" style="color:#f39c12"></i>':''}</td><td>${badges}</td><td><b>${a.valor>0?'R$ '+a.valor.toFixed(2):'-'}</b></td>
        <td class="no-print" style="position:relative">
            <button class="menu-btn" onclick="toggleMenu(event, '${a.id}')"><i class="fas fa-ellipsis-v"></i></button>
            <div id="menu-${a.id}" class="dropdown-menu">
                <div class="menu-header">Ações</div>
                <div class="action-row"><div class="action-btn" onclick="gerarPedido('${a.id}')"><i class="fas fa-file-invoice"></i> Pedido</div></div>
                <div class="menu-header">Filtros de Dias</div>
                <div class="grid-days">${[1,2,3,4,5,6,7,8,9,10].map(d=>`<div class="action-btn btn-d${d} ${tags.includes('day'+d)?'active':''}" onclick="toggleTag('${a.id}', 'day${d}')">${d}º</div>`).join('')}<div class="action-btn btn-entregue ${tags.includes('outros')?'active':''}" onclick="toggleTag('${a.id}', 'outros')">Entregue</div></div>
                <div class="menu-header">Pagamento (Sem Desconto)</div>
                <div class="action-row">
                    <div class="action-btn btn-pay-pix ${tags.includes('pay_pix')?'active':''}" onclick="toggleTag('${a.id}', 'pay_pix')">Pix</div>
                    <div class="action-btn btn-pay-card ${tags.includes('pay_debito')?'active':''}" onclick="toggleTag('${a.id}', 'pay_debito')">Débito</div>
                </div>
                <div class="action-row">
                    <div class="action-btn btn-pay-card ${tags.includes('pay_cred_vista')?'active':''}" onclick="toggleTag('${a.id}', 'pay_cred_vista')">Créd Vista</div>
                    <div class="action-btn btn-pay-card ${tags.includes('pay_cred_parc')?'active':''}" onclick="toggleTag('${a.id}', 'pay_cred_parc')">Créd Parc</div>
                </div>
                <div class="menu-header">Funcionário (Com Desconto)</div>
                <div class="action-row"><div class="action-btn btn-func ${tags.includes('func_pix')?'active':''}" onclick="toggleTag('${a.id}', 'func_pix')">Pix -15%</div><div class="action-btn btn-func ${tags.includes('func_vista')?'active':''}" onclick="toggleTag('${a.id}', 'func_vista')">Créd -10%</div><div class="action-btn btn-func ${tags.includes('func_parc')?'active':''}" onclick="toggleTag('${a.id}', 'func_parc')">Parc -5%</div></div>
                <div class="action-row"><div class="action-btn btn-reset" onclick="toggleTag('${a.id}', 'reset')"><i class="fas fa-undo"></i> Reset</div><div class="action-btn btn-del" onclick="remover('${a.id}')">Excluir</div></div>
            </div>
        </td>`;
        tb.appendChild(tr);
    });
    document.getElementById('displayTotal').innerText = tot.toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
    document.getElementById('displayQtd').innerText = qtd;
}

function addManual() { const i=document.getElementById('inputNome'); if(i.value.trim()) { criarAluno(i.value.trim()); i.value=''; } }
function criarAluno(n) { 
    getEscola().alunos.push({id:Date.now().toString(), data:new Date().toLocaleDateString('pt-BR'), nome:n, turmaBase:estadoSelecao.serie, turmaCompleta:`${estadoSelecao.serie} - ${estadoSelecao.letra}`, valor:0, status:'pendente', livros:[], obs:'', tags:[]}); 
    save(); renderTabela(); showToast("Aluno adicionado!"); 
}
function remover(id) { Swal.fire({ title: 'Excluir aluno?', text: "Não será possível desfazer.", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sim, excluir' }).then((r) => { if (r.isConfirmed) { const e=getEscola(); e.alunos=e.alunos.filter(a=>a.id.toString()!==id.toString()); save(); renderTabela(); showToast("Removido."); } }) }

function toggleTag(id, tag) {
    const aluno = getEscola().alunos.find(x => x.id.toString() === id.toString()); if(!aluno) return;
    if(!aluno.tags) aluno.tags = [];
    if(tag === 'reset') { aluno.tags = []; aluno.livros = []; aluno.valor = 0; aluno.detalheDesc = ""; }
    else {
        if (tag.startsWith('day') || tag === 'outros') {
            aluno.tags = aluno.tags.filter(t => !t.startsWith('day') && t !== 'outros');
            const jaTem = aluno.tags.includes(tag);
            if(!jaTem) {
                aluno.tags.push(tag);
                if(tag.startsWith('day')) {
                    let catalogo = getEscola().livrosPorTurma[aluno.turmaBase] || [];
                    if(catalogo.length && typeof catalogo[0]==='string') catalogo = catalogo.map(n=>({nome:n}));
                    aluno.livros = catalogo.map(i => i.nome);
                }
            } else { const idx = aluno.tags.indexOf(tag); if(idx > -1) aluno.tags.splice(idx, 1); aluno.livros = []; }
        } 
        else if (tag.startsWith('func')) {
            aluno.tags = aluno.tags.filter(t => !t.startsWith('func') && !t.startsWith('pay_')); 
            const idx = aluno.tags.indexOf(tag); if(idx > -1) aluno.tags.splice(idx, 1); else aluno.tags.push(tag);
        }
        else if (tag.startsWith('pay_')) {
            aluno.tags = aluno.tags.filter(t => !t.startsWith('pay_') && !t.startsWith('func')); 
            const idx = aluno.tags.indexOf(tag); if(idx > -1) aluno.tags.splice(idx, 1); else aluno.tags.push(tag);
        }
        else { const idx = aluno.tags.indexOf(tag); if(idx > -1) aluno.tags.splice(idx, 1); else aluno.tags.push(tag); }
    }
    recalcularPrecoAluno(aluno); save(); renderTabela();
}

function recalcularPrecoAluno(aluno) {
    if(aluno.livros.length === 0 && aluno.tags.length === 0) { aluno.valor = 0; return; }
    let basePrice = 0; const catalogo = getEscola().livrosPorTurma?.[aluno.turmaBase] || [];
    const listaCatalogo = (catalogo.length && typeof catalogo[0]==='string') ? catalogo.map(n=>({nome:n, preco:0})) : catalogo;
    aluno.livros.forEach(ln => { const item = listaCatalogo.find(i=>i.nome===ln); if(item) basePrice += item.preco; });
    
    let finalPrice = basePrice;
    if (aluno.tags.includes('func_pix')) finalPrice *= 0.85;
    else if (aluno.tags.includes('func_vista')) finalPrice *= 0.90;
    else if (aluno.tags.includes('func_parc')) finalPrice *= 0.95;
    
    aluno.valor = finalPrice;
}

// --- DETALHES ---
function abrirDetalhes(id) {
    alunoEditandoId = id.toString();
    const aluno = getEscola().alunos.find(a => a.id.toString() === id.toString()); if(!aluno) return;
    document.getElementById('lblNomeAlunoDetalhe').innerText = aluno.nome;
    document.getElementById('lblTurmaAlunoDetalhe').innerText = aluno.turmaCompleta || "Turma";
    document.getElementById('txtObsAluno').value = aluno.obs || "";
    let catalogo = getEscola().livrosPorTurma?.[aluno.turmaBase] || [];
    if(catalogo.length && typeof catalogo[0] === 'string') catalogo = catalogo.map(n=>({nome:n, preco: 0}));
    const container = document.getElementById('listaLivrosChecklist'); container.innerHTML = ''; somaTemp = 0;
    
    if(catalogo.length === 0) {
        container.innerHTML = '<p style="color:#999; font-style:italic;">Nenhum livro cadastrado.</p>';
        document.getElementById('areaSomaValor').style.display = 'none';
    } else {
        document.getElementById('areaSomaValor').style.display = 'flex';
        catalogo.forEach(livroObj => {
            const checked = (aluno.livros || []).includes(livroObj.nome) ? 'checked' : '';
            if(checked) somaTemp += livroObj.preco;
            container.innerHTML += `<div class="book-item"><input type="checkbox" class="book-checkbox" value="${livroObj.nome}" data-price="${livroObj.preco}" ${checked} onchange="recalcularSoma()"><div class="book-label">${livroObj.nome}</div>${livroObj.preco > 0 ? `<span class="book-price-tag">R$ ${livroObj.preco.toFixed(2)}</span>` : ''}</div>`;
        });
    }
    document.getElementById('lblSomaTotal').innerText = "R$ " + somaTemp.toFixed(2);
    abrirModal('modalDetalhesAluno');
}
function recalcularSoma() {
    const checkboxes = document.querySelectorAll('.book-checkbox'); somaTemp = 0;
    checkboxes.forEach(cb => { if(cb.checked) somaTemp += parseFloat(cb.getAttribute('data-price') || 0); });
    document.getElementById('lblSomaTotal').innerText = "R$ " + somaTemp.toFixed(2);
}
function aplicarSomaAoAluno() { const aluno = getEscola().alunos.find(a => a.id.toString() === alunoEditandoId); if(aluno) { salvarDetalhesAluno(false); recalcularPrecoAluno(aluno); save(); renderTabela(); fecharModal('modalDetalhesAluno'); } }
function salvarDetalhesAluno(fechar = true) { const aluno = getEscola().alunos.find(a => a.id.toString() === alunoEditandoId); if(!aluno) return; aluno.obs = document.getElementById('txtObsAluno').value; const checkboxes = document.querySelectorAll('.book-checkbox'); aluno.livros = []; checkboxes.forEach(cb => { if(cb.checked) aluno.livros.push(cb.value); }); save(); renderTabela(); if(fechar) fecharModal('modalDetalhesAluno'); }

// --- UTIL ---
function abrirModal(id){ const m = document.getElementById(id); if(m) m.style.display='flex'; }
function fecharModal(id){ const m = document.getElementById(id); if(m) m.style.display='none'; }
function toggleMenu(e,id) { e.stopPropagation(); document.querySelectorAll('.dropdown-menu').forEach(m=>m.classList.remove('show')); const m=document.getElementById(`menu-${id}`); if(m) m.classList.toggle('show'); }
document.onclick = () => document.querySelectorAll('.dropdown-menu').forEach(m=>m.classList.remove('show'));
function toggleSelectAll(c) { const all=document.querySelectorAll('.row-checkbox'); selectedIds.clear(); if(c.checked) all.forEach(x=>{x.checked=true; selectedIds.add(x.dataset.id)}); else all.forEach(x=>x.checked=false); updateBar(); }
function toggleSelect(id) { if(selectedIds.has(id)) selectedIds.delete(id); else selectedIds.add(id); updateBar(); }
function updateBar() { const b=document.getElementById('floatingActionBar'); document.getElementById('countSelected').innerText=selectedIds.size; if(selectedIds.size>0) b.classList.add('visible'); else b.classList.remove('visible'); }
function clearSelection() { selectedIds.clear(); document.querySelectorAll('.custom-checkbox').forEach(x=>x.checked=false); updateBar(); }
function batchSale(t) { selectedIds.forEach(id=>toggleTag(id, t)); clearSelection(); }
function batchDelete() { Swal.fire({ title: 'Excluir selecionados?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33' }).then((r) => { if(r.isConfirmed) { escolas.find(e=>e.id.toString()===escolaAtivaId.toString()).alunos = getEscola().alunos.filter(a=>!selectedIds.has(a.id.toString())); save(); renderTabela(); clearSelection(); showToast("Excluídos."); } }); }
function batchTag(tag) { selectedIds.forEach(id=>toggleTag(id, tag)); clearSelection(); }
function baixarExcel() { let csv="\ufeffData;Turma;Aluno;Valor;Tags;Livros\n"; getEscola().alunos.forEach(a=>{csv+=`"${a.data}";"${a.turmaCompleta}";"${a.nome}";"${a.valor.toFixed(2).replace('.',',')}";"${(a.tags||[]).join('|')}";"${(a.livros||[]).join('|')}"\n`}); const l=document.createElement("a"); l.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})); l.download="vendas.csv"; l.click(); }
function imprimirPDF() { window.print(); }
function gerarRelatorioFinanceiro() { const e = getEscola(); let totalPix = 0, totalCred = 0, totalParc = 0, totalOutros = 0; e.alunos.forEach(a => { if(a.valor > 0) { if(a.tags.includes('func_pix')) totalPix += a.valor; else if(a.tags.includes('func_vista')) totalCred += a.valor; else if(a.tags.includes('func_parc')) totalParc += a.valor; else totalOutros += a.valor; } }); const totalGeral = totalPix + totalCred + totalParc + totalOutros; Swal.fire({ title: 'Relatório Financeiro', html: `<div style="text-align:left; font-size:14px;"><p><strong>Pix:</strong> R$ ${totalPix.toFixed(2)}</p><p><strong>Crédito (Vista):</strong> R$ ${totalCred.toFixed(2)}</p><p><strong>Parcelado:</strong> R$ ${totalParc.toFixed(2)}</p><p><strong>Outros:</strong> R$ ${totalOutros.toFixed(2)}</p><hr><p style="font-size:18px;"><strong>TOTAL: R$ ${totalGeral.toFixed(2)}</strong></p></div>`, icon: 'info' }); }
function renderCatalogUI() { const sel = document.getElementById('selectCatalogTurma'); if(!sel) return; if(sel.options.length === 0) { TURMAS_BASE.forEach(t => { const o = document.createElement('option'); o.value=t; o.innerText=t; sel.appendChild(o); }); sel.value = estadoSelecao.serie; } renderCatalogTable(); }
function renderCatalogTable() { const turma = document.getElementById('selectCatalogTurma').value; const tbody = document.getElementById('catalogTableBody'); tbody.innerHTML = ''; let catalogo = getEscola().livrosPorTurma[turma] || []; if(catalogo.length && typeof catalogo[0]==='string') catalogo = catalogo.map(n=>({nome:n, preco:0})); let total = 0; catalogo.forEach((item, idx) => { total += item.preco; const tr = document.createElement('tr'); tr.innerHTML = `<td>${item.nome}</td><td>R$ ${item.preco.toFixed(2)}</td><td style="text-align:center"><button class="btn-icon" onclick="removeBookFromCatalog('${turma}', ${idx})"><i class="fas fa-trash"></i></button></td>`; tbody.appendChild(tr); }); document.getElementById('catalogTotal').innerText = "R$ " + total.toFixed(2); }
function addBookToCatalog() { const turma = document.getElementById('selectCatalogTurma').value; const nome = document.getElementById('newBookName').value; const preco = parseFloat(document.getElementById('newBookPrice').value); if(nome && !isNaN(preco)) { let catalogo = getEscola().livrosPorTurma[turma] || []; if(catalogo.length && typeof catalogo[0]==='string') catalogo = catalogo.map(n=>({nome:n, preco:0})); catalogo.push({nome: nome, preco: preco}); getEscola().livrosPorTurma[turma] = catalogo; document.getElementById('newBookName').value = ''; document.getElementById('newBookPrice').value = ''; save(); renderCatalogTable(); atualizarDisplayPreco(); showToast("Livro adicionado!"); } else { showToast("Preencha nome e preço!", "error"); } }
function removeBookFromCatalog(turma, idx) { let catalogo = getEscola().livrosPorTurma[turma]; catalogo.splice(idx, 1); save(); renderCatalogTable(); atualizarDisplayPreco(); }
function abrirConfigLivros() { const l=getEscola().livrosPorTurma?.[estadoSelecao.serie]||[]; document.getElementById('txtListaLivros').value = l.map(i=>`${i.nome}; ${i.preco}`).join('\n'); document.getElementById('lblTurmaConfig').innerText=estadoSelecao.serie; abrirModal('modalConfigLivros'); }
function salvarLivrosTurma() { const t=document.getElementById('txtListaLivros').value; getEscola().livrosPorTurma[estadoSelecao.serie] = t.split('\n').map(l=>{const p=l.split(';'); return {nome:p[0].trim(), preco:p[1]?parseFloat(p[1]):0}}).filter(i=>i.nome); save(); fecharModal('modalConfigLivros'); renderCatalogUI(); atualizarDisplayPreco(); }

function gerarPedido(id) {
    const escola = getEscola();
    const aluno = escola.alunos.find(a => a.id.toString() === id.toString());
    if (!aluno) return;
    nomeArquivoReciboAtual = `Recibo - ${aluno.nome} - ${aluno.turmaCompleta}`;
    let html = `<div class="receipt-header">${escola.logo ? `<img src="${escola.logo}" style="height:50px; display:block; margin: 0 auto 10px auto;">` : ''}<div class="receipt-title">${escola.nome}</div><div>Canal do Livro - Pedido de Venda</div></div><div class="receipt-info"><strong>Data:</strong> ${aluno.data}<br><strong>Aluno:</strong> ${aluno.nome}<br><strong>Turma:</strong> ${aluno.turmaCompleta}</div><table class="receipt-table"><thead><tr><th>Item</th><th style="text-align:right">Valor</th></tr></thead><tbody>`;
    let catalogo = [];
    if (escola.livrosPorTurma && escola.livrosPorTurma[aluno.turmaBase]) { catalogo = escola.livrosPorTurma[aluno.turmaBase]; if(catalogo.length > 0 && typeof catalogo[0] === 'string') catalogo = catalogo.map(n => ({nome: n, preco: 0})); }
    let totalCalculado = 0;
    (aluno.livros || []).forEach(livroNome => { 
        const itemCatalogo = catalogo.find(i => i.nome === livroNome); 
        const preco = itemCatalogo ? itemCatalogo.preco : 0; 
        totalCalculado += preco; 
        html += `<tr><td>${livroNome}</td><td style="text-align:right">R$ ${preco.toFixed(2)}</td></tr>`; 
    });
    if (Math.abs(totalCalculado - aluno.valor) > 0.01) { html += `<tr><td><i>Ajuste / Desconto</i></td><td style="text-align:right"><i>R$ ${(aluno.valor - totalCalculado).toFixed(2)}</i></td></tr>`; }
    html += `</tbody></table><div class="receipt-total">Total a Pagar: R$ ${aluno.valor.toFixed(2)}</div><div style="margin-top:10px; font-size:11px;">Obs: ${aluno.obs || '-'}</div><div class="receipt-sign">Assinatura do Responsável</div>`;
    const container = document.getElementById('receiptContent');
    if (container) { container.innerHTML = html; container.style.display = 'block'; abrirModal('modalRecibo'); }
}
function imprimirReciboAcao() { const tituloOriginal = document.title; document.title = nomeArquivoReciboAtual; document.body.classList.add('print-receipt'); window.print(); document.body.classList.remove('print-receipt'); document.title = tituloOriginal; }
function baixarImagemRecibo() { const e = document.getElementById('receiptContent'); html2canvas(e).then(c => { const l = document.createElement('a'); l.download = nomeArquivoReciboAtual + ".png"; l.href = c.toDataURL(); l.click(); }); }
document.getElementById('inputFile').addEventListener('change', function(e) { showToast("Use a Importação de Excel.", "info"); this.value = ""; });