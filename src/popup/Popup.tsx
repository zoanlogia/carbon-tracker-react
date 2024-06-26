import { HelpCircle } from "lucide-react";
import React, { useEffect, useState } from "react";
import { getData } from "../api/get-data";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../components/ui/carousel";
import { cn, formatBytes, formatCO2, formatEnergy } from "../lib/utils";
import {
  AccordionPopup,
  CounterCircle,
  DownloadIcon,
  LeafIcon,
  LeafyIcon,
  RefreshIcon,
  ZapIcon,
} from "./components/index";
import { ColumnProps, useColumns } from "./components/table/Column";
import { DataTable } from "./components/table/Data-table";

const Popup: React.FC = () => {
  const [data, setData] = useState<ColumnProps[]>([]);
  const [dataReceived, setDataReceived] = useState({ value: 0, unit: "Bytes" });
  const [energyConsumed, setEnergyConsumed] = useState({
    value: 0,
    unit: "Wh",
  });
  const [co2Emissions, setCo2Emissions] = useState({ value: 0, unit: "g" });
  const [show, setShow] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const columns = useColumns();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const newData = await getData();
        setData(newData);

        const totalValues = newData.reduce(
          (acc, domain) => ({
            totalDataReceived: acc.totalDataReceived + domain.dataUsage.value,
            totalEnergyConsumed:
              acc.totalEnergyConsumed + domain.electricityUsage.value,
            totalCo2Emissions:
              acc.totalCo2Emissions + domain.carbonEmissions.value,
          }),
          {
            totalDataReceived: 0,
            totalEnergyConsumed: 0,
            totalCo2Emissions: 0,
          }
        );

        setDataReceived(formatBytes(totalValues.totalDataReceived));
        setEnergyConsumed(formatEnergy(totalValues.totalEnergyConsumed));
        setCo2Emissions(formatCO2(totalValues.totalCo2Emissions));
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();

    const handleChange = (
      changes: chrome.storage.StorageChange,
      areaName: string
    ) => {
      if (areaName === "local" && changes?.newValue) {
        fetchData();
      }
    };

    chrome.storage.onChanged.addListener(handleChange);

    return () => chrome.storage.onChanged.removeListener(handleChange);
  }, []);

  const handleReset = () => {
    // clear the table data
    chrome.storage.local.set({ domains: {} });
    chrome.storage.local.clear();

    setData([]);
    setDataReceived({ value: 0, unit: "Bytes" });
    setEnergyConsumed({ value: 0, unit: "Wh" });
    setCo2Emissions({ value: 0, unit: "g" });
  };

  return (
    <div
      className={cn(
        activeIndex === 0 ? "w-[400px]" : "w-[600px]",
        "px-4 py-6 bg-slate-200 rounded-3xl relative m-1 transition-all duration-100 ease-out"
      )}
    >
      <div className="flex items-center justify-center gap-x-1">
        <h1 className="text-center text-3xl font-bold text-green-800">
          Carbon Tracker
        </h1>
        <LeafIcon className="text-green-800" />
      </div>
      <p className="text-center text-xxs text-gray-600 dark:text-gray-300">
        Keep track of your carbon footprint
      </p>
      <hr className="w-48 h-1 mx-auto my-6 bg-gray-100 border-0 rounded md:my-10 dark:bg-gray-700" />
      <Carousel>
        <CarouselContent>
          <CarouselItem className={cn(activeIndex === 0 ? "block" : "hidden")}>
            <div className="my-8 flex justify-center items-center gap-4">
              <CounterCircle
                id="dataReceived"
                value={dataReceived.value}
                icon={<DownloadIcon />}
                unit={dataReceived.unit}
              />
              <CounterCircle
                id="energyConsumed"
                value={energyConsumed.value}
                icon={<ZapIcon />}
                unit={energyConsumed.unit}
              />
              <CounterCircle
                id="co2Emissions"
                value={co2Emissions.value}
                icon={<LeafyIcon />}
                unit={co2Emissions.unit}
              />
            </div>
            <div className="flex items-center justify-between">
              <button
                className="bg-green-800 hover:bg-green-700 transition-colors flex items-center justify-center rounded-lg text-white p-2 gap-x-1"
                onClick={handleReset}
              >
                <span>Reset</span> <RefreshIcon className="w-[16px] h-[16px]" />
              </button>
              <HelpCircle
                className="w-[16px] h-[16px] cursor-pointer hover:scale-110 transition-all duration-300 ease-in-out"
                onClick={() => setShow(!show)}
              />
            </div>
            {show && <AccordionPopup />}
          </CarouselItem>

          <CarouselItem className={cn(activeIndex === 1 ? "block" : "hidden")}>
            <DataTable key={data.length} columns={columns} data={data} />
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious
          onClick={() => setActiveIndex((prev) => Math.max(prev - 1, 0))}
          className="!top-[-15%] !left-0"
          disabled={activeIndex === 0}
        />
        <CarouselNext
          onClick={() => setActiveIndex((prev) => Math.min(prev + 1, 1))}
          className="!top-[-15%] !right-0"
          disabled={activeIndex === 1}
        />
      </Carousel>
    </div>
  );
};

export default Popup;
