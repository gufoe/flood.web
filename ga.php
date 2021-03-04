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
        $t = microtime(true);
        $db = new DB(
            conf('DB_PROTOCOL', 'mysql'),
            conf('DB_HOST', 'mysql.x'),
            conf('DB_NAME', 'ga'),
            conf('DB_USER', 'root'),
            conf('DB_PASS', 'secret')
        );
        _log('db in '. (microtime(true) - $t));
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
    // for every creature to be created
    for ($i = 0; $i < 10; $i++) {
        // $j < ?
        $offset = (int) sqrt($count); // consider only top percent
        // For $j times get random < $j
        for ($j = 0; $j < 5; $j++) {
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
            $d = json_decode($c['data']);
            $d->offset = $offset;
            $c['data'] = json_encode($d);
            $ret[] = $c;
        }
    }

    $ids = [];
    foreach ($ret as $c) $ids[] = $c['id'];
    if (!empty($ids)) {
        db()->exec('UPDATE creatures set children = children+1 where id in ('.implode(',', $ids).')');
    }

	_log("end $id");
    return $ret;
}

if (($exp = input('bestof'))) {
    $q = 'SELECT id FROM creatures WHERE';
    $q.= ' experiment=? order by fitness desc limit 1';
    $id = @db()->query($q, [ $exp ], true)['id'];
    if ($id) {
      echo @file_get_contents("data/creature-$id.json");
    }
    exit;
}

if (($exp = input('target')) && ($creatures = input('creatures'))) {
    $time_tot = microtime(true);
    foreach ($creatures as $c) {
        // $c = json_decode($c, true);
        $data = [
            'name'       => @$c['name'],
            'children'   => (int) @$c['children'],
            'fitness'    => $c['fitness'],
            'experiment' => $exp,
            'parent_id'  => $c['parent_id'],
        ];

        // db()->beginTransaction();
        if (@$c['parent_id']) {
            db()->exec('UPDATE creatures SET children=children+1 WHERE id=?', [@$c['parent_id']]);
        }
        $time = microtime(true);
        $id = db()->insert('creatures', $data);

        $num = db()->query('select count(*) as c from creatures where experiment=?', [$exp], true)['c'];

        // filter and keep only the top 10% of the souls
        $minfit = db()->query('select fitness as f from creatures where experiment=? order by fitness desc limit 1 offset ?', [$exp, $num/10], true)['f'];
        // var_dump($num);
        if ($c['fitness'] > $minfit) {
            $file = "data/creature-$id.json";
            $saved = file_put_contents($file, $c['data']);
            if (!$saved) {
                die("Cannot save creature data to $file");
            }
        }

        _log('inserted in '.(microtime(true)-$time).' secs');
        // db()->commit();
    }
    _log('total insert: '.(microtime(true)-$time_tot).' secs');
    $time_tot = microtime(true);
    echo json_encode(count($creatures));
    _log('echoed data: '.(microtime(true)-$time_tot).' secs');
    exit;
}

if (input('source')) {
    $source = db()->query('SELECT experiment as name, COUNT(*) as size FROM creatures WHERE experiment=? GROUP BY experiment', [ input('source') ], true);
    $target = db()->query('SELECT experiment as name, COUNT(*) as size FROM creatures WHERE experiment=? GROUP BY experiment', [ input('target') ], true);
    echo json_encode([
        'creatures' => ga(input('source')),
        'source' => [
            'name' => @$source['name'],
            'size' => @$source['size'],
        ],
        'target' => [
            'name' => @$target['name'],
            'size' => @$target['size'],
        ],
    ]);
    exit;
}


function e($str) {
    return htmlentities($str, ENT_QUOTES);
}

$experiments = db()->query('SELECT experiment as name, count(*) as count from creatures group by experiment');

// Stats based on time
// $q = "SELECT
//     concat(created_at, ' utc') as time,
//     max(fitness) as max_fitness,
//     avg(fitness) as avg_fitness,
//     min(fitness) as min_fitness,
//     count(*) as experiments
//     FROM `creatures`
//     where created_at>='2018-02-21 23:30'";
// $data = [];
// if (($i = input('experiment'))) {
//     $q.= ' and experiment=?'; $data[] = $i;
// }
// if (($i = input('since'))) {
//     $q.= ' and created_at>?'; $data[] = $i;
// }
// if (($i = input('to'))) {
//     $q.= ' and created_at=?'; $data[] = $i;
// }
// $q.=" group by concat(date(created_at), ' ',hour(created_at),':', minute(created_at))";

$filters = ['1=1'];
$filter_data = [];
if (($i = input('experiment'))) {
    $filters[] = 'experiment=?'; $filter_data[] = $i;
}
if (($i = input('since'))) {
    $filters[] = 'created_at>?'; $filter_data[] = $i;
}
if (($i = input('to'))) {
    $filters[] = 'created_at=?'; $filter_data[] = $i;
}

// Count experiments
$exp_count = db()->query('SELECT count(*) as c from creatures where '.implode(' and ', $filters), $filter_data, true)['c'];


// Stats based on number
$q = "SELECT
    min(count),
    max(fitness) as max_fitness,
    avg(fitness) as avg_fitness,
    min(fitness) as min_fitness
    -- concat('\"', min(created_at), '\"') as aaa,
    -- concat('\"', max(created_at), '\"') as bbb
    -- count(*) as experiments
    FROM (select (IF(@row IS NULL, @row:=0, @row:=@row+1 )) as count, fitness from creatures where "
    .implode(' and ', $filters)
    ." order by created_at asc) creatures"
    ." group by FLOOR(count/".((int)input('chunk')?:100).")";
    // ." order by count asc";
    // ." group by FLOOR(count/".(($exp_count+2)/1000).")";
    // ." order by created_at asc";
// echo $exp_count;
$stats_min = db()->query($q, $filter_data);
?>
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <title></title>
        <link rel="stylesheet" href="assets/dygraph.css">
        <script src="assets/dygraph.min.js" charset="utf-8"></script>
        <style media="screen">
            body {
                background: #2f3640;
            }
            .graph {
                /* background: #596275; */
            }
            body {
                color: #9fafc6;
                margin: 0;
                font-family: monospace;
            }
            h1 {
                margin: 20px 30px 40px;
            }
            .dygraph-axis-label { color: inherit; }
            .dygraph-legend {
                background: rgba(47, 54, 64, .7);
                border: 1px solid #718093;
                top: 10px!important;
                left: 70px!important;
                padding: 15px;
                line-height: 25px;
            }
            .dygraph-legend > span {
                display: block;
                /* text-align: right; */
            }
            .dygraph-legend b span {
                display: inline-block;
                width: 100px;
            }
            .dygraph-roller {
                left: 70px!important;
                top: auto!important;
                bottom: 40px;
            }

            input, select {
                height: 30px;
                background: rgba(47, 54, 64, .7);
                border: 1px solid #718093;
                padding: 2px;
                text-align: center;
                color: inherit;
            }
        </style>
    </head>
    <body>
        <h1>Experiment Statistics</h1>
        <form action="" method="get">
            <select name="experiment">
                <option value="">All</option>
                <?php foreach ($experiments as $e): ?>
                    <option <?=($e['name'] == input('experiment') ? 'selected' : '')?> value="<?=e($e['name'])?>">
                        <?=e($e['name'])?> (<?=e($e['count'])?>)
                    </option>
                <?php endforeach ?>
            </select>
            <input type="date" placeholder="Since" name="since" value="<?=e(input('since'))?>">
            <input type="date" placeholder="To" name="to" value="<?=e(input('to'))?>">
            <input type="number" step="1" placeholder="Chunk Size" name="chunk" value="<?=e(input('chunk') ?: 100)?>">
            <input type="submit" value="Go">
        </form>
        <div id="graphdiv" class="graph"></div>
        <script type="text/javascript">
          g = new Dygraph(

            // containing div
            document.getElementById("graphdiv"),

            // CSV or path to a CSV file.
            <?php
            $csv = implode(',', array_keys((array)@$stats_min[0]))."\n";
            foreach ($stats_min as $row) {
                $csv.= implode(',', (array) $row)."\n";
            }
            echo json_encode($csv);
            ?>
            , {
                rollPeriod: 0,
                showRoller: true,
                animatedZooms: true,
                width: window.innerWidth,
                height: window.innerHeight-200,
                colors: ['#2ecc71', '#f1c40f', '#e84118', '#9c88ff'],
                gridLineColor: '#3b3f4f',
                axisLineColor: '#718093',
                independentTicks: true,
                // showRangeSelector: true
                // stepPlot: true,
            }
          );
        </script>
    </body>
</html>
