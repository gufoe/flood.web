<?php
require_once('db.php');

function conf($field, $default = null) {
    static $config;
    if (!$config) $config = include_once('env.php');
    if (!isset($config[$field])) {
        $config[$field] = $default;
    }
    return $config[$field];
}

function input($name)
{
    return @$_REQUEST[$name];
}

function db() {
    static $db;
    if (!$db) {
        $db = new DB(
            conf('DB_HOST', 'mysql.x'),
            conf('DB_NAME', 'ga'),
            conf('DB_USER', 'root'),
            conf('DB_PASS', 'secret')
        );
    }
    return $db;
}

function _log($str) {
	$str = microtime(true)."\t".date('Y-m-d H:i:s')."\t".$str."\n";
	file_put_contents('ga.log', $str, FILE_APPEND);
}

function ga($experiment) {
    $q = 'SELECT COUNT(*) as count FROM creatures WHERE';
    $q.= ' experiment=?';
    $id = substr(md5(rand()), 0, 5);
	_log("start $id");
    $count = db()->query($q, [ $experiment ], true)['count'];
    if (!$count) return [];
    $ret = [];
    for ($i = 0; $i < 5; $i++) {
        $offset = min(1000, $count-1);
        for ($j = 0; $j < 3; $j++) {
            $offset = rand(0, $offset);
        }
        $q = 'SELECT * FROM creatures WHERE';
        $q.= ' experiment=?';
        $q.= ' ORDER BY fitness DESC';
        $q.= " LIMIT 1 OFFSET $offset";
		_log("q$i $offset $id");
        $c = db()->query($q, [ $experiment ], true);

		_log("f$i $id");
        $c['data'] = file_get_contents("data/creature-{$c['id']}.json");
        if ($c['data']) {
            $ret[] = $c;
        }
    }
	_log("end $id");
    return $ret;
}

if (($exp = input('target')) && ($creatures = input('creatures'))) {
    // print_r($creatures);
    // die();
    foreach ($creatures as $c) {
        // $c = json_decode($c, true);
        $data = [
            'name'       => @$c['name'],
            'children'   => (int) @$c['children'],
            'fitness'    => $c['fitness'],
            'experiment' => $exp,
            'parent_id'  => $c['parent_id'],
        ];

        db()->beginTransaction();
        db()->exec('UPDATE creatures SET children=children+1 WHERE id=?', [@$c['parent_id']]);
        $id = db()->insert('creatures', $data);
        $file = "data/creature-$id.json";
        $saved = file_put_contents($file, $c['data']);
        if (!$saved) {
            die("Cannot save creature data to $file");
        }
        db()->commit();

    }
}

if (input('source')) {
    $source = db()->query('SELECT experiment as name, COUNT(*) as size FROM creatures WHERE experiment=? GROUP BY experiment', [ input('source') ], true);
    $target = db()->query('SELECT experiment as name, COUNT(*) as size FROM creatures WHERE experiment=? GROUP BY experiment', [ input('target') ], true);

    die(json_encode([
        'creatures' => ga(input('source')),
        'source' => [
            'name' => $source['name'],
            'size' => $source['size'],
        ],
        'target' => [
            'name' => $target['name'],
            'size' => $target['size'],
        ],
    ]));
}
