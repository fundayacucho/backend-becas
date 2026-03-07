const { TipoRegistro } = require('../models');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de Multer para imágenes de registro
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/config';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'tipo-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido. Solo imágenes JPG, PNG, WEBP y SVG.'));
        }
    },
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB
}).single('image');

/**
 * Obtiene todos los tipos de registro
 */
const getTiposRegistro = async (req, res) => {
    try {
        const tipos = await TipoRegistro.findAll({
            order: [['id', 'ASC']]
        });
        res.json(tipos);
    } catch (error) {
        console.error('Error en getTiposRegistro:', error);
        res.status(500).json({ success: false, message: 'Error al obtener tipos de registro' });
    }
};

/**
 * Actualiza un tipo de registro
 */
const updateTipoRegistro = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }

        try {
            const { id } = req.params;
            const { title, description } = req.body;

            const tipo = await TipoRegistro.findByPk(id);
            if (!tipo) {
                return res.status(404).json({ success: false, message: 'Tipo de registro no encontrado' });
            }

            const updateData = {};
            if (title) updateData.title = title;
            if (description) updateData.description = description;

            if (req.file) {
                // Guardar la URL relativa de la nueva imagen
                // Asumiendo que las imágenes se sirven desde /uploads
                const newImagePath = `/uploads/config/${req.file.filename}`;

                // Opcional: Eliminar imagen anterior si era local
                if (tipo.image && tipo.image.startsWith('/uploads/')) {
                    const oldPath = path.join(__dirname, '..', tipo.image);
                    if (fs.existsSync(oldPath)) {
                        try { fs.unlinkSync(oldPath); } catch (e) { console.warn('No se pudo borrar imagen antigua:', e); }
                    }
                }

                updateData.image = newImagePath;
            }

            await tipo.update(updateData);

            res.json({
                success: true,
                message: 'Tipo de registro actualizado',
                data: tipo
            });
        } catch (error) {
            console.error('Error en updateTipoRegistro:', error);
            res.status(500).json({ success: false, message: 'Error al actualizar el tipo de registro' });
        }
    });
};

module.exports = {
    getTiposRegistro,
    updateTipoRegistro
};
