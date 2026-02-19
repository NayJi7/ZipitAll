export type Language = 'en' | 'fr' | 'de' | 'es' | 'zh' | 'ja';

interface Translations {
    file: string;
    files: string;
    folder: string;
    folders: string;
    filterPlaceholder: string;
    extractFile: string;
    extractFolder: string;
    extractArchive: string;
    extractSelection: string;
    noEntries: string;
    bytes: string;
    kb: string;
    mb: string;
    gb: string;
    previewDisabled: string;
    previewDisabledDetail: string;
    filePreviewDisabled: string;
    filePreviewDisabledDetail: string;
    openSettings: string;
    dontTellAgain: string;
    archiveTooLarge: string;
    archiveTooLargeDetail: string;
    openAnyway: string;
    cancel: string;
    fileTooLarge: string;
    fileTooLargeDetail: string;
    extractedFile: string;
    extractedFolder: string;
    extractedArchive: string;
    extractedSelection: string;
    extractError: string;
    cannotOpenFile: string;
    selectFolderToExtract: string;
    archiveExtractedTo: string;
    failedToExtractArchive: string;
    enterArchiveName: string;
    fileAlreadyExists: string;
    yes: string;
    no: string;
    archiveCreated: string;
    compressionFailed: string;
    archiveTooLargeBytes: string;
    previewNotSupported: string;
    failedToPreviewArchive: string;
    fileTooLargeBytes: string;
}

const translations: Record<Language, Translations> = {
    en: {
        file: 'file',
        files: 'files',
        folder: 'folder',
        folders: 'folders',
        filterPlaceholder: 'Filter files...',
        extractFile: 'Extract file',
        extractFolder: 'Extract folder',
        extractArchive: 'Extract',
        extractSelection: 'Extract selected',
        noEntries: 'No entries found in this archive.',
        bytes: 'B',
        kb: 'KB',
        mb: 'MB',
        gb: 'GB',
        previewDisabled: 'Archive preview is disabled',
        previewDisabledDetail: 'Enable it in settings to view archives.',
        filePreviewDisabled: 'File preview from archives is disabled',
        filePreviewDisabledDetail: 'Enable it in settings to open files.',
        openSettings: 'Open Settings',
        dontTellAgain: "Don't tell me again",
        archiveTooLarge: 'Archive is {0} MB (limit: {1} MB)',
        archiveTooLargeDetail: 'Preview may be slow.',
        openAnyway: 'Open Anyway',
        cancel: 'Cancel',
        fileTooLarge: 'File is {0} MB (limit: {1} MB)',
        fileTooLargeDetail: 'Opening may be slow.',
        extractedFile: 'Extracted: {0}',
        extractedFolder: 'Extracted folder: {0} ({1} files)',
        extractedArchive: 'Archive extracted to: {0}',
        extractedSelection: 'Extracted {0} items to: {1}',
        extractError: 'Failed to extract: {0}',
        cannotOpenFile: 'Cannot open file: {0}',
        selectFolderToExtract: 'Select folder to extract into',
        archiveExtractedTo: 'Archive extracted to: {0}',
        failedToExtractArchive: 'Failed to extract archive: {0}',
        enterArchiveName: 'Enter name for {0} archive',
        fileAlreadyExists: 'File "{0}" already exists. Overwrite?',
        yes: 'Yes',
        no: 'No',
        archiveCreated: 'Archive created: {0}',
        compressionFailed: 'Compression failed: {0}',
        archiveTooLargeBytes: 'Archive is too large ({0} bytes). Max size: {1} bytes.',
        previewNotSupported: 'Preview not yet supported for {0} files.',
        failedToPreviewArchive: 'Failed to preview archive: {0}',
        fileTooLargeBytes: 'File is too large ({0} bytes). Max size: {1} bytes.',
    },
    fr: {
        file: 'fichier',
        files: 'fichiers',
        folder: 'dossier',
        folders: 'dossiers',
        filterPlaceholder: 'Filtrer les fichiers...',
        extractFile: 'Extraire le fichier',
        extractFolder: 'Extraire le dossier',
        extractArchive: 'Extraire',
        extractSelection: 'Extraire la sélection',
        noEntries: 'Aucune entrée trouvée dans cette archive.',
        bytes: 'o',
        kb: 'Ko',
        mb: 'Mo',
        gb: 'Go',
        previewDisabled: "L'aperçu des archives est désactivé",
        previewDisabledDetail: 'Activez-le dans les paramètres pour voir les archives.',
        filePreviewDisabled: "L'aperçu des fichiers depuis les archives est désactivé",
        filePreviewDisabledDetail: 'Activez-le dans les paramètres pour ouvrir les fichiers.',
        openSettings: 'Ouvrir les paramètres',
        dontTellAgain: 'Ne plus me le dire',
        archiveTooLarge: "L'archive fait {0} Mo (limite: {1} Mo)",
        archiveTooLargeDetail: "L'aperçu peut être lent.",
        openAnyway: 'Ouvrir quand même',
        cancel: 'Annuler',
        fileTooLarge: 'Le fichier fait {0} Mo (limite: {1} Mo)',
        fileTooLargeDetail: "L'ouverture peut être lente.",
        extractedFile: 'Extrait: {0}',
        extractedFolder: 'Dossier extrait: {0} ({1} fichiers)',
        extractedArchive: 'Archive extraite vers: {0}',
        extractedSelection: '{0} éléments extraits vers: {1}',
        extractError: "Échec de l'extraction: {0}",
        cannotOpenFile: "Impossible d'ouvrir le fichier: {0}",
        selectFolderToExtract: 'Sélectionner le dossier de destination',
        archiveExtractedTo: 'Archive extraite vers : {0}',
        failedToExtractArchive: "Échec de l'extraction de l'archive : {0}",
        enterArchiveName: "Entrez le nom pour l'archive {0}",
        fileAlreadyExists: 'Le fichier "{0}" existe déjà. Remplacer ?',
        yes: 'Oui',
        no: 'Non',
        archiveCreated: 'Archive créée : {0}',
        compressionFailed: 'Échec de la compression : {0}',
        archiveTooLargeBytes: 'Archive trop volumineuse ({0} octets). Taille max : {1} octets.',
        previewNotSupported: 'Aperçu non pris en charge pour les fichiers {0}.',
        failedToPreviewArchive: "Échec de l'aperçu de l'archive : {0}",
        fileTooLargeBytes: 'Fichier trop volumineux ({0} octets). Taille max : {1} octets.',
    },
    de: {
        file: 'Datei',
        files: 'Dateien',
        folder: 'Ordner',
        folders: 'Ordner',
        filterPlaceholder: 'Dateien filtern...',
        extractFile: 'Datei extrahieren',
        extractFolder: 'Ordner extrahieren',
        extractArchive: 'Extrahieren',
        extractSelection: 'Auswahl extrahieren',
        noEntries: 'Keine Einträge in diesem Archiv gefunden.',
        bytes: 'B',
        kb: 'KB',
        mb: 'MB',
        gb: 'GB',
        previewDisabled: 'Archivvorschau ist deaktiviert',
        previewDisabledDetail: 'Aktivieren Sie sie in den Einstellungen, um Archive anzuzeigen.',
        filePreviewDisabled: 'Dateivorschau aus Archiven ist deaktiviert',
        filePreviewDisabledDetail: 'Aktivieren Sie sie in den Einstellungen, um Dateien zu öffnen.',
        openSettings: 'Einstellungen öffnen',
        dontTellAgain: 'Nicht wieder anzeigen',
        archiveTooLarge: 'Archiv ist {0} MB (Limit: {1} MB)',
        archiveTooLargeDetail: 'Die Vorschau kann langsam sein.',
        openAnyway: 'Trotzdem öffnen',
        cancel: 'Abbrechen',
        fileTooLarge: 'Datei ist {0} MB (Limit: {1} MB)',
        fileTooLargeDetail: 'Das Öffnen kann langsam sein.',
        extractedFile: 'Extrahiert: {0}',
        extractedFolder: 'Ordner extrahiert: {0} ({1} Dateien)',
        extractedArchive: 'Archiv extrahiert nach: {0}',
        extractedSelection: '{0} Elemente extrahiert nach: {1}',
        extractError: 'Extraktion fehlgeschlagen: {0}',
        cannotOpenFile: 'Datei kann nicht geöffnet werden: {0}',
        selectFolderToExtract: 'Zielordner auswählen',
        archiveExtractedTo: 'Archiv extrahiert nach: {0}',
        failedToExtractArchive: 'Extraktion des Archivs fehlgeschlagen: {0}',
        enterArchiveName: 'Name für {0}-Archiv eingeben',
        fileAlreadyExists: 'Datei "{0}" existiert bereits. Überschreiben?',
        yes: 'Ja',
        no: 'Nein',
        archiveCreated: 'Archiv erstellt: {0}',
        compressionFailed: 'Komprimierung fehlgeschlagen: {0}',
        archiveTooLargeBytes: 'Archiv zu groß ({0} Bytes). Max. Größe: {1} Bytes.',
        previewNotSupported: 'Vorschau für {0}-Dateien noch nicht unterstützt.',
        failedToPreviewArchive: 'Vorschau des Archivs fehlgeschlagen: {0}',
        fileTooLargeBytes: 'Datei zu groß ({0} Bytes). Max. Größe: {1} Bytes.',
    },
    es: {
        file: 'archivo',
        files: 'archivos',
        folder: 'carpeta',
        folders: 'carpetas',
        filterPlaceholder: 'Filtrar archivos...',
        extractFile: 'Extraer archivo',
        extractFolder: 'Extraer carpeta',
        extractArchive: 'Extraer',
        extractSelection: 'Extraer selección',
        noEntries: 'No se encontraron entradas en este archivo.',
        bytes: 'B',
        kb: 'KB',
        mb: 'MB',
        gb: 'GB',
        previewDisabled: 'La vista previa de archivos está deshabilitada',
        previewDisabledDetail: 'Habilítela en la configuración para ver archivos.',
        filePreviewDisabled: 'La vista previa de archivos está deshabilitada',
        filePreviewDisabledDetail: 'Habilítela en la configuración para abrir archivos.',
        openSettings: 'Abrir configuración',
        dontTellAgain: 'No volver a decirme',
        archiveTooLarge: 'El archivo es {0} MB (límite: {1} MB)',
        archiveTooLargeDetail: 'La vista previa puede ser lenta.',
        openAnyway: 'Abrir de todos modos',
        cancel: 'Cancelar',
        fileTooLarge: 'El archivo es {0} MB (límite: {1} MB)',
        fileTooLargeDetail: 'La apertura puede ser lenta.',
        extractedFile: 'Extraído: {0}',
        extractedFolder: 'Carpeta extraída: {0} ({1} archivos)',
        extractedArchive: 'Archivo extraído a: {0}',
        extractedSelection: '{0} elementos extraídos a: {1}',
        extractError: 'Error al extraer: {0}',
        cannotOpenFile: 'No se puede abrir el archivo: {0}',
        selectFolderToExtract: 'Seleccionar carpeta de destino',
        archiveExtractedTo: 'Archivo extraído a: {0}',
        failedToExtractArchive: 'Error al extraer el archivo: {0}',
        enterArchiveName: 'Introduzca el nombre para el archivo {0}',
        fileAlreadyExists: 'El archivo "{0}" ya existe. ¿Sobrescribir?',
        yes: 'Sí',
        no: 'No',
        archiveCreated: 'Archivo creado: {0}',
        compressionFailed: 'Error de compresión: {0}',
        archiveTooLargeBytes: 'Archivo demasiado grande ({0} bytes). Tamaño máx: {1} bytes.',
        previewNotSupported: 'Vista previa aún no compatible con archivos {0}.',
        failedToPreviewArchive: 'Error al previsualizar el archivo: {0}',
        fileTooLargeBytes: 'Archivo demasiado grande ({0} bytes). Tamaño máx: {1} bytes.',
    },
    zh: {
        file: '个文件',
        files: '个文件',
        folder: '个文件夹',
        folders: '个文件夹',
        filterPlaceholder: '筛选文件...',
        extractFile: '提取文件',
        extractFolder: '提取文件夹',
        extractArchive: '提取',
        extractSelection: '提取所选',
        noEntries: '在此归档中未找到任何条目。',
        bytes: 'B',
        kb: 'KB',
        mb: 'MB',
        gb: 'GB',
        previewDisabled: '归档预览已禁用',
        previewDisabledDetail: '在设置中启用以查看归档。',
        filePreviewDisabled: '从归档中预览文件已禁用',
        filePreviewDisabledDetail: '在设置中启用以打开文件。',
        openSettings: '打开设置',
        dontTellAgain: '不再提示',
        archiveTooLarge: '归档大小为 {0} MB（限制：{1} MB）',
        archiveTooLargeDetail: '预览可能会很慢。',
        openAnyway: '仍要打开',
        cancel: '取消',
        fileTooLarge: '文件大小为 {0} MB（限制：{1} MB）',
        fileTooLargeDetail: '打开可能会很慢。',
        extractedFile: '已提取：{0}',
        extractedFolder: '已提取文件夹：{0}（{1} 个文件）',
        extractedArchive: '归档已提取到：{0}',
        extractedSelection: '已提取 {0} 个项目到：{1}',
        extractError: '提取失败：{0}',
        cannotOpenFile: '无法打开文件：{0}',
        selectFolderToExtract: '选择提取目标文件夹',
        archiveExtractedTo: '归档已提取到：{0}',
        failedToExtractArchive: '提取归档失败：{0}',
        enterArchiveName: '输入 {0} 归档名称',
        fileAlreadyExists: '文件 "{0}" 已存在。是否覆盖？',
        yes: '是',
        no: '否',
        archiveCreated: '归档已创建：{0}',
        compressionFailed: '压缩失败：{0}',
        archiveTooLargeBytes: '归档太大（{0} 字节）。最大大小：{1} 字节。',
        previewNotSupported: '尚不支持 {0} 文件的预览。',
        failedToPreviewArchive: '预览归档失败：{0}',
        fileTooLargeBytes: '文件太大（{0} 字节）。最大大小：{1} 字节。',
    },
    ja: {
        file: 'ファイル',
        files: 'ファイル',
        folder: 'フォルダ',
        folders: 'フォルダ',
        filterPlaceholder: 'ファイルをフィルタ...',
        extractFile: 'ファイルを抽出',
        extractFolder: 'フォルダを抽出',
        extractArchive: '抽出',
        extractSelection: '選択項目を抽出',
        noEntries: 'このアーカイブにエントリが見つかりません。',
        bytes: 'B',
        kb: 'KB',
        mb: 'MB',
        gb: 'GB',
        previewDisabled: 'アーカイブプレビューは無効です',
        previewDisabledDetail: '設定で有効にしてアーカイブを表示します。',
        filePreviewDisabled: 'アーカイブからのファイルプレビューは無効です',
        filePreviewDisabledDetail: '設定で有効にしてファイルを開きます。',
        openSettings: '設定を開く',
        dontTellAgain: '再度表示しない',
        archiveTooLarge: 'アーカイブは {0} MB（制限：{1} MB）です',
        archiveTooLargeDetail: 'プレビューが遅くなる可能性があります。',
        openAnyway: 'とにかく開く',
        cancel: 'キャンセル',
        fileTooLarge: 'ファイルは {0} MB（制限：{1} MB）です',
        fileTooLargeDetail: '開くのが遅くなる可能性があります。',
        extractedFile: '抽出しました：{0}',
        extractedFolder: 'フォルダを抽出しました：{0}（{1} ファイル）',
        extractedArchive: 'アーカイブを抽出しました：{0}',
        extractedSelection: '{0} 個のアイテムを {1} に抽出しました',
        extractError: '抽出に失敗しました：{0}',
        cannotOpenFile: 'ファイルを開けません：{0}',
        selectFolderToExtract: '抽出先フォルダを選択',
        archiveExtractedTo: 'アーカイブを抽出しました：{0}',
        failedToExtractArchive: 'アーカイブの抽出に失敗しました：{0}',
        enterArchiveName: '{0} アーカイブの名前を入力',
        fileAlreadyExists: 'ファイル "{0}" は既に存在します。上書きしますか？',
        yes: 'はい',
        no: 'いいえ',
        archiveCreated: 'アーカイブを作成しました：{0}',
        compressionFailed: '圧縮に失敗しました：{0}',
        archiveTooLargeBytes: 'アーカイブが大きすぎます（{0} バイト）。最大サイズ：{1} バイト。',
        previewNotSupported: '{0} ファイルのプレビューはまだサポートされていません。',
        failedToPreviewArchive: 'アーカイブのプレビューに失敗しました：{0}',
        fileTooLargeBytes: 'ファイルが大きすぎます（{0} バイト）。最大サイズ：{1} バイト。',
    },
};

export function getLocale(): Language {
    const envLang = process.env.VSCODE_NLS_CONFIG;
    if (envLang) {
        try {
            const config = JSON.parse(envLang);
            const locale = config.locale as string;
            if (locale.startsWith('fr')) return 'fr';
            if (locale.startsWith('de')) return 'de';
            if (locale.startsWith('es')) return 'es';
            if (locale.startsWith('zh')) return 'zh';
            if (locale.startsWith('ja')) return 'ja';
        } catch {}
    }
    return 'en';
}

export function t(key: keyof Translations, lang: Language = getLocale()): string {
    return translations[lang][key];
}

export function formatFileCount(count: number, lang: Language): string {
    return `${count} ${count === 1 ? t('file', lang) : t('files', lang)}`;
}

export function formatFolderCount(count: number, lang: Language): string {
    return `${count} ${count === 1 ? t('folder', lang) : t('folders', lang)}`;
}

export function formatSize(bytes: number, lang: Language): string {
    if (bytes === 0) return `0 ${t('bytes', lang)}`;
    const units = [t('bytes', lang), t('kb', lang), t('mb', lang), t('gb', lang)];
    let i = 0;
    let size = bytes;
    while (size >= 1024 && i < units.length - 1) {
        size /= 1024;
        i++;
    }
    return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}
