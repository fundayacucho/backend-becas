-- Consulta para contar becarios venezolanos registrados
SELECT 
    'Becarios Venezolanos' as tipo,
    COUNT(*) as cantidad
FROM becarios_unificados 
WHERE id_tipo_becario = 1

UNION ALL

SELECT 
    'Becarios en el Exterior' as tipo,
    COUNT(*) as cantidad
FROM becarios_unificados 
WHERE id_tipo_becario = 2

UNION ALL

SELECT 
    'Becarios Extranjeros' as tipo,
    COUNT(*) as cantidad
FROM becarios_unificados 
WHERE id_tipo_becario = 3

UNION ALL

SELECT 
    'Total General' as tipo,
    COUNT(*) as cantidad
FROM becarios_unificados;

-- Consulta detallada con descripción del catálogo
SELECT 
    ctb.descripcion as tipo_becario,
    COUNT(*) as cantidad,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM becarios_unificados), 2) as porcentaje
FROM becarios_unificados bu
INNER JOIN cat_tipo_becario ctb ON bu.id_tipo_becario = ctb.id
GROUP BY ctb.descripcion, bu.id_tipo_becario
ORDER BY bu.id_tipo_becario;
