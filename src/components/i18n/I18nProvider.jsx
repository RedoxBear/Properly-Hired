
import React, { createContext, useContext, useMemo, useState, useEffect } from "react";

const I18nContext = createContext({ t: (k) => k, lang: "en", setLang: () => {} });

const translations = {
  en: {
    nav: {
      dashboard: "Dashboard",
      my_resumes: "My Resumes",
      build_resume: "Build Resume",
      job_library: "Job Library",
      job_analysis: "Job Analysis",
      resume_optimizer: "Resume Optimizer",
      transferable_skills: "Transferable Skills",
      cover_letters: "Cover Letters",
      qa_assistant: "Q&A Assistant",
      resume_templates: "Resume Templates",
      transferable_skills_ai: "Transferable Skills AI",
      desc: {
        dashboard: "Overview & Quick Actions",
        my_resumes: "Manage all your resumes",
        build_resume: "Start from scratch (voice or type)",
        job_library: "View all your applications",
        job_analysis: "Analyze Job Postings",
        resume_optimizer: "Tailor Your Resume",
        transferable_skills: "Identify & Retarget Your Skills",
        cover_letters: "Generate Cover Letters",
        qa_assistant: "Application Questions Help",
        resume_templates: "Choose & Print Templates",
        transferable_skills_ai: "Identify & Retarget Your Skills with AI",
      }
    },
    header: {
      dashboard_title: "Welcome to",
      dashboard_sub: "Transform your job applications with AI-powered optimization, tailored cover letters, and intelligent matching",
      my_resumes_title: "My Resumes",
      my_resumes_sub: "Manage your master resumes and view all the AI-optimized versions.",
      job_library_title: "All Job Applications",
      job_library_sub: "Track, manage, and review all your saved job applications in one place.",
      builder_title: "Build Your Resume From Scratch",
      builder_sub: "Answer by voice or typing. We’ll structure a professional resume for you and let you pick a template.",
      optimizer_title: "AI-Powered Resume Optimization",
      optimizer_sub: "Leverage AI to analyze job descriptions and optimize your resume for maximum impact.",
      transferable_skills_ai_title: "AI-Powered Transferable Skills",
      transferable_skills_ai_sub: "Identify and articulate your skills in new contexts, making career transitions smoother and more effective.",
    },
    controls: {
      language: "Language",
      theme: "Theme",
      dark: "Dark",
      light: "Light",
      start_voice_session: "Start Voice Session",
      stop_voice_session: "Stop Voice Session",
      clear_transcript: "Clear Transcript",
      use_transcript: "Use Transcript to Build",
      add_more_prompt: "Your input is quite short. Would you like to add more before building?",
      logo_alt: "Resume AI Logo",
      start_voice_session_desc: "Begin speaking to record your input for the resume builder.",
      stop_voice_session_desc: "Stop recording and process your voice input.",
      clear_transcript_desc: "Remove all text from the current transcript.",
      use_transcript_desc: "Generate resume content using the transcribed text.",
      add_more_prompt_long: "You have provided a lot of details. Are you ready to build your resume, or would you like to add more?",
      cancel: "Cancel",
      build: "Build",
      continue: "Continue",
      no_thank_you: "No, Thank You",
      yes_please: "Yes, Please",
    }
  },
  es: {
    nav: {
      dashboard: "Panel",
      my_resumes: "Mis CVs",
      build_resume: "Crear CV",
      job_library: "Biblioteca de Empleos",
      job_analysis: "Análisis de Empleo",
      resume_optimizer: "Optimizar CV",
      transferable_skills: "Habilidades Transferibles",
      cover_letters: "Cartas de Presentación",
      qa_assistant: "Asistente de Preguntas",
      resume_templates: "Plantillas de CV",
      transferable_skills_ai: "Habilidades Transferibles IA",
      desc: {
        dashboard: "Resumen y acciones rápidas",
        my_resumes: "Administra todos tus CVs",
        build_resume: "Comienza desde cero (voz o texto)",
        job_library: "Ver todas tus postulaciones",
        job_analysis: "Analizar ofertas",
        resume_optimizer: "Ajustar tu CV",
        transferable_skills: "Identificar y reorientar habilidades",
        cover_letters: "Generar cartas",
        qa_assistant: "Ayuda con preguntas",
        resume_templates: "Elegir e imprimir plantillas",
        transferable_skills_ai: "Identifica y Reorienta tus Habilidades con IA",
      }
    },
    header: {
      dashboard_title: "Bienvenido a",
      dashboard_sub: "Mejora tus postulaciones con optimización por IA y cartas personalizadas",
      my_resumes_title: "Mis CVs",
      my_resumes_sub: "Gestiona tus CVs maestros y versiones optimizadas por IA.",
      job_library_title: "Todas las Postulaciones",
      job_library_sub: "Administra y revisa todas tus postulaciones en un solo lugar.",
      builder_title: "Crea tu CV desde cero",
      builder_sub: "Responde por voz o escribiendo. Estructuramos tu CV y eliges una plantilla.",
      optimizer_title: "Optimización de CV con IA",
      optimizer_sub: "Aprovecha la IA para analizar descripciones de puestos y optimizar tu currículum para un impacto máximo.",
      transferable_skills_ai_title: "Habilidades Transferibles con IA",
      transferable_skills_ai_sub: "Identifica y articula tus habilidades en nuevos contextos, haciendo las transiciones de carrera más fluidas y efectivas.",
    },
    controls: {
      language: "Idioma",
      theme: "Tema",
      dark: "Oscuro",
      light: "Claro",
      start_voice_session: "Iniciar sesión de voz",
      stop_voice_session: "Detener sesión de voz",
      clear_transcript: "Limpiar transcripción",
      use_transcript: "Usar transcripción para crear",
      add_more_prompt: "Tu entrada es corta. ¿Deseas agregar más antes de crear?",
      logo_alt: "Logo de Resume AI",
      start_voice_session_desc: "Comienza a hablar para grabar tu entrada para el creador de currículums.",
      stop_voice_session_desc: "Detén la grabación y procesa tu entrada de voz.",
      clear_transcript_desc: "Eliminar todo el texto de la transcripción actual.",
      use_transcript_desc: "Generar contenido del currículum usando el texto transcrito.",
      add_more_prompt_long: "Has proporcionado muchos detalles. ¿Estás listo para crear tu currículum, o te gustaría agregar más?",
      cancel: "Cancelar",
      build: "Crear",
      continue: "Continuar",
      no_thank_you: "No, gracias",
      yes_please: "Sí, por favor",
    }
  },
  "zh-CN": {
    nav: {
      dashboard: "总览",
      my_resumes: "我的简历",
      build_resume: "从零开始",
      job_library: "职位库",
      job_analysis: "职位分析",
      resume_optimizer: "简历优化",
      transferable_skills: "可迁移技能",
      cover_letters: "求职信",
      qa_assistant: "问答助手",
      resume_templates: "简历模板",
      transferable_skills_ai: "AI可迁移技能",
      desc: {
        dashboard: "概览与快捷操作",
        my_resumes: "管理所有简历",
        build_resume: "语音或手动创建",
        job_library: "查看所有申请",
        job_analysis: "分析职位",
        resume_optimizer: "定制你的简历",
        transferable_skills: "识别并重定向技能",
        cover_letters: "生成求职信",
        qa_assistant: "申请问题助手",
        resume_templates: "选择并打印模板",
        transferable_skills_ai: "AI识别并重定向你的技能",
      }
    },
    header: {
      dashboard_title: "欢迎来到",
      dashboard_sub: "用AI优化简历和求职信，提高匹配度与通过率",
      my_resumes_title: "我的简历",
      my_resumes_sub: "管理主简历与所有优化版本。",
      job_library_title: "全部职位申请",
      job_library_sub: "在一个地方跟踪和管理你的职位申请。",
      builder_title: "从零开始创建简历",
      builder_sub: "使用语音或输入回答，我们将为你生成结构化简历并套用模板。",
      optimizer_title: "AI智能简历优化",
      optimizer_sub: "利用AI分析职位描述，优化你的简历以达到最大效果。",
      transferable_skills_ai_title: "AI驱动的可迁移技能",
      transferable_skills_ai_sub: "识别并清晰阐述你在新语境下的技能，使职业转型更顺畅、更有效。",
    },
    controls: {
      language: "语言",
      theme: "主题",
      dark: "深色",
      light: "浅色",
      start_voice_session: "开始语音会话",
      stop_voice_session: "停止语音会话",
      clear_transcript: "清空转录",
      use_transcript: "用转录生成简历",
      add_more_prompt: "你的输入较少，是否继续补充后再生成？",
      logo_alt: "Resume AI Logo",
      start_voice_session_desc: "开始说话，录制你的简历构建输入。",
      stop_voice_session_desc: "停止录音并处理你的语音输入。",
      clear_transcript_desc: "清除当前转录中的所有文本。",
      use_transcript_desc: "使用转录文本生成简历内容。",
      add_more_prompt_long: "你提供了很多细节。准备好构建你的简历了吗，或者还想添加更多？",
      cancel: "取消",
      build: "构建",
      continue: "继续",
      no_thank_you: "不，谢谢",
      yes_please: "是的，请",
    }
  },
  "zh-TW": {
    nav: {
      dashboard: "總覽",
      my_resumes: "我的履歷",
      build_resume: "從零開始",
      job_library: "職缺庫",
      job_analysis: "職缺分析",
      resume_optimizer: "履歷優化",
      transferable_skills: "可轉移技能",
      cover_letters: "求職信",
      qa_assistant: "問答助理",
      resume_templates: "履歷模板",
      transferable_skills_ai: "AI可轉移技能",
      desc: {
        dashboard: "概覽與快速操作",
        my_resumes: "管理所有履歷",
        build_resume: "語音或輸入建立",
        job_library: "查看所有申請",
        job_analysis: "分析職缺",
        resume_optimizer: "調整你的履歷",
        transferable_skills: "辨識並重定向技能",
        cover_letters: "生成求職信",
        qa_assistant: "申請問題助手",
        resume_templates: "選擇並列印模板",
        transferable_skills_ai: "AI辨識並重定向你的技能",
      }
    },
    header: {
      dashboard_title: "歡迎來到",
      dashboard_sub: "用AI優化履歷與求職信，提升匹配度與通過率",
      my_resumes_title: "我的履歷",
      my_resumes_sub: "管理主履歷與所有優化版本。",
      job_library_title: "全部職缺申請",
      job_library_sub: "集中追蹤並管理你的申請。",
      builder_title: "從零開始建立履歷",
      builder_sub: "以語音或輸入回答，我們會結構化你的履歷並套用模板。",
      optimizer_title: "AI 智能履歷優化",
      optimizer_sub: "利用 AI 分析職位描述，優化你的履歷以達到最大效果。",
      transferable_skills_ai_title: "AI驅動的可轉移技能",
      transferable_skills_ai_sub: "辨識並清晰闡述你在新語境下的技能，使職業轉型更順暢、更有效。",
    },
    controls: {
      language: "語言",
      theme: "主題",
      dark: "深色",
      light: "淺色",
      start_voice_session: "開始語音對話",
      stop_voice_session: "停止語音對話",
      clear_transcript: "清除轉錄",
      use_transcript: "使用轉錄生成履歷",
      add_more_prompt: "你的內容較少，是否再補充一些再生成？",
      logo_alt: "Resume AI Logo",
      start_voice_session_desc: "開始說話，錄製你的履歷建立輸入。",
      stop_voice_session_desc: "停止錄音並處理你的語音輸入。",
      clear_transcript_desc: "清除目前轉錄中的所有文本。",
      use_transcript_desc: "使用轉錄文本生成履歷內容。",
      add_more_prompt_long: "你提供了很多細節。準備好建立你的履歷了嗎，或者還想添加更多？",
      cancel: "取消",
      build: "建立",
      continue: "繼續",
      no_thank_you: "不，謝謝",
      yes_please: "是的，請",
    }
  }
};

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("lang") || "en");
  useEffect(() => localStorage.setItem("lang", lang), [lang]);

  const t = useMemo(() => {
    const dict = translations[lang] || translations.en;
    return (key) => {
      const parts = key.split(".");
      let cur = dict;
      for (const p of parts) {
        if (cur && typeof cur === "object" && p in cur) cur = cur[p];
        else return key; // fallback to key
      }
      return cur;
    };
  }, [lang]);

  const value = useMemo(() => ({ t, lang, setLang }), [t, lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
